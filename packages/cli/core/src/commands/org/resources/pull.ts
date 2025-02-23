import {ResourceSnapshotType} from '@coveo/platform-client';
import {
  formatOrgId,
  startSpinner,
  stopSpinner,
} from '@coveo/cli-commons/utils/ux';

import {Flags} from '@oclif/core';
import {blueBright} from 'chalk';
import {readJsonSync} from 'fs-extra';
import {resolve} from 'path';
import {cwd} from 'process';
import dedent from 'ts-dedent';
import {Config} from '@coveo/cli-commons/config/config';
import {
  HasNecessaryCoveoPrivileges,
  IsAuthenticated,
  Preconditions,
} from '@coveo/cli-commons/preconditions/index';
import {IsGitInstalled} from '../../../lib/decorators/preconditions/git';
import {writeSnapshotPrivilege} from '@coveo/cli-commons/preconditions/platformPrivilege';
import {Trackable} from '@coveo/cli-commons/preconditions/trackable';
import {SnapshotOperationTimeoutError} from '../../../lib/errors';
import {ProcessAbort} from '../../../lib/errors/processError';
import {
  organization,
  snapshotId,
  wait,
} from '../../../lib/flags/snapshotCommonFlags';
import {Project} from '../../../lib/project/project';
import type {
  SnapshotPullModel,
  SnapshotPullModelResources,
} from '../../../lib/snapshot/pullModel/interfaces';
import {buildResourcesToExport} from '../../../lib/snapshot/pullModel/validation/model';
import {validateSnapshotPullModel} from '../../../lib/snapshot/pullModel/validation/validate';
import {Snapshot, WaitUntilDoneOptions} from '../../../lib/snapshot/snapshot';
import {
  getTargetOrg,
  cleanupProject,
} from '../../../lib/snapshot/snapshotCommon';
import {allowedResourceType} from '../../../lib/snapshot/snapshotConstant';
import {SnapshotFactory} from '../../../lib/snapshot/snapshotFactory';
import {confirmWithAnalytics} from '../../../lib/utils/cli';
import {spawnProcess} from '../../../lib/utils/process';
import {CLICommand} from '@coveo/cli-commons/command/cliCommand';
import {Example} from '@oclif/core/lib/interfaces';

const PullCommandStrings = {
  projectOverwriteQuestion: (
    resourceFolderName: string
  ) => dedent`There is already a Coveo project with resources in it.
  This command will delete the project in ${resourceFolderName} folder and start a new one, do you want to proceed? (y/n)`,
  howToPullAfterTimeout: (targetOrgId: string, snapshotId: string) => dedent`

      Once the snapshot is created, you can pull it with the following command:

        ${blueBright`coveo org:resources:pull -o ${targetOrgId} -s ${snapshotId}`}

        `,
};

export default class Pull extends CLICommand {
  public static description = 'Pull resources from an organization';

  public static flags = {
    ...wait(),
    ...organization(
      'The unique identifier of the organization from which to pull the resources'
    ),
    ...snapshotId(),
    git: Flags.boolean({
      char: 'g',
      description:
        'Whether to create a git repository when creating a new project.',
      default: true,
      allowNo: true,
    }),
    overwrite: Flags.boolean({
      char: 'f',
      description: 'Overwrite resources directory if it exists.',
      default: false,
    }),
    resourceTypes: Flags.enum<ResourceSnapshotType>({
      char: 'r',
      helpValue: 'type1 type2',
      description: 'The resources types to pull from the organization.',
      multiple: true,
      options: allowedResourceType,
      default: allowedResourceType,
    }),
    model: Flags.custom<SnapshotPullModel>({
      parse: (input: string): Promise<SnapshotPullModel> => {
        const model = readJsonSync(resolve(input));
        validateSnapshotPullModel(model);
        return model;
      },
    })({
      char: 'm',
      helpValue: 'path/to/snapshot.json',
      exclusive: ['snapshotId', 'resourceTypes', 'target'],
      description:
        'The path to a snapshot pull model. This flag is useful when you want to include only specific resource items in your snapshot (e.g., a subset of sources). Use the "org:resources:model:create" command to create a new Snapshot Pull Model',
    }),
  };

  public static examples: Example[] = [
    {
      command: 'coveo org:resources:pull',
      description:
        'Pull all resources from the organization in which you are authenticated',
    },
    {
      command: 'coveo org:resources:pull --organization myorgid --wait 0',
      description:
        'Pull all resources from the organization whose ID is "myorgid" and do not timeout',
    },
    {
      command: 'coveo org:resources:pull --model my/snapshot/pull/model.json',
      description:
        'Pull only the resources specified in the snapshot pull model',
    },
    {
      command: `coveo org:resources:pull --resourceTypes ${ResourceSnapshotType.queryPipeline} ${ResourceSnapshotType.field},`,
      description:
        'Pull all query pipelines and fields available in the organization',
    },
  ];

  @Trackable()
  @Preconditions(
    IsAuthenticated(),
    IsGitInstalled(),
    HasNecessaryCoveoPrivileges(writeSnapshotPrivilege)
  )
  public async run() {
    const targetOrganization = await this.getTargetOrg();
    const project = new Project(this.projectPath, targetOrganization);
    await this.ensureProjectReset(project);

    const snapshot = await this.getSnapshot();

    startSpinner('Updating project with Snapshot');
    await this.refreshProject(project, snapshot);
    project.writeResourcesManifest(targetOrganization);

    if (await this.shouldDeleteSnapshot()) {
      await snapshot.delete();
    }
    stopSpinner();
  }

  private async shouldDeleteSnapshot() {
    return !(await this.parse(Pull)).flags.snapshotId;
  }

  public async catch(err?: Error & {exitCode?: number}) {
    cleanupProject(this.projectPath);
    await this.supplementErrorMessage(err);
    return super.catch(err);
  }

  private async supplementErrorMessage(err?: Error & {exitCode?: number}) {
    if (err instanceof SnapshotOperationTimeoutError) {
      const snapshot = err.snapshot;
      const target = await this.getTargetOrg();
      err.message += PullCommandStrings.howToPullAfterTimeout(
        target,
        snapshot.id
      );
    }
  }

  private async refreshProject(project: Project, snapshot: Snapshot) {
    const flags = await this.getFlags();
    if (flags.git && !project.contains('.git')) {
      await spawnProcess('git', ['init', `${this.projectPath}`], {
        stdio: 'ignore',
      });
    }
    const snapshotBlob = await snapshot.download();
    await project.refresh(snapshotBlob);
  }

  private async ensureProjectReset(project: Project) {
    if (await this.shouldAbortProjectReset(project)) {
      throw new ProcessAbort();
    }

    project.reset();
  }

  private async shouldAbortProjectReset(project: Project) {
    const flags = await this.getFlags();
    return (
      !flags.overwrite &&
      project.contains(Project.resourceFolderName) &&
      !(await this.askUserShouldWeOverwrite())
    );
  }

  private askUserShouldWeOverwrite() {
    const question = PullCommandStrings.projectOverwriteQuestion(
      Project.resourceFolderName
    );
    return confirmWithAnalytics(question, 'project overwrite');
  }

  private async getSnapshot() {
    const flags = await this.getFlags();
    const target = await this.getTargetOrg();
    return flags.snapshotId
      ? this.getExistingSnapshot(flags.snapshotId, target)
      : this.createAndGetNewSnapshot(target);
  }

  private async createAndGetNewSnapshot(target: string) {
    const resourcesToExport = await this.getResourceSnapshotTypesToExport();
    startSpinner(`Creating Snapshot from ${formatOrgId(target)}`);
    const waitOption = await this.getWaitOption();
    return SnapshotFactory.createFromOrg(resourcesToExport, target, waitOption);
  }

  private async getExistingSnapshot(snapshotId: string, target: string) {
    startSpinner('Retrieving Snapshot');
    const waitOption = await this.getWaitOption();
    return SnapshotFactory.createFromExistingSnapshot(
      snapshotId,
      target,
      waitOption
    );
  }

  private async getWaitOption(): Promise<WaitUntilDoneOptions> {
    const flags = await this.getFlags();
    return {wait: flags.wait};
  }

  private get configuration() {
    return new Config(this.config.configDir);
  }

  private async getResourceSnapshotTypesToExport(): Promise<SnapshotPullModelResources> {
    const flags = await this.getFlags();
    return flags.model
      ? flags.model.resourcesToExport
      : buildResourcesToExport(flags.resourceTypes!);
  }

  private async getTargetOrg() {
    const flags = await this.getFlags();
    return getTargetOrg(
      this.configuration,
      flags.model?.orgId || flags.organization
    );
  }

  public async getFlags() {
    const {flags} = await this.parse(Pull);
    if (flags.model) {
      return {...flags, organization: flags.model.orgId};
    }
    return flags;
  }

  private get projectPath() {
    return cwd();
  }
}
