import {applyPatch} from 'diff';
import {
  ResourceSnapshotsReportModel,
  ResourceSnapshotType,
  SnapshotDiffModel,
} from '@coveord/platform-client';
import {CliUx} from '@oclif/core';
import axios from 'axios';
import {
  mkdirSync,
  existsSync,
  readdirSync,
  writeFileSync,
  Dirent,
  rmSync,
  readFileSync,
} from 'fs-extra';
import {join, resolve} from 'path';
import {buildResourcesToExport} from '../pullModel/validation/model';
import {SnapshotFactory} from '../snapshotFactory';
import {Project} from '../../project/project';
import {DiffServer} from './server/server';

export class SnapshotDiffReporter {
  private static readonly previewDirectoryName = 'preview';
  private static previewHistorySize = 1;

  private resourcesToPreview: ResourceSnapshotType[];

  public constructor(
    // We are in the destination org
    private readonly orgId: string,
    private readonly report: ResourceSnapshotsReportModel,
    private readonly diffModel: SnapshotDiffModel, // destination snapshot report
    private readonly projectPath: string
  ) {
    this.resourcesToPreview = Object.keys(
      this.report.resourceOperationResults
    ) as ResourceSnapshotType[];
  }

  private get previewDirectory() {
    return join(this.projectPath, SnapshotDiffReporter.previewDirectoryName);
  }

  // TODO: pull initial state: Snapshot pull
  // TODO: use diff to apply patch and get final state (for each file)
  // TODO: generate an HTML page with Monaco by passing initial and final sttate (for each file)

  // Pass files by websocket
  public async preview() {
    if (!this.hasChanges) {
      CliUx.ux.action.stop("There isn't anything to compare in this snapshot.");
      return;
    }

    if (existsSync(this.previewDirectory)) {
      this.deleteOldestPreviews();
    }
    const dirPath = join(this.previewDirectory, this.diffModel.snapshotId);
    const diffPath = join(dirPath, 'diff'); // TODO: make the project create a diff folder

    // mkdirSync(dirPath, {
    //   recursive: true,
    // });
    mkdirSync(diffPath, {
      recursive: true,
    });

    const project = new Project(resolve(dirPath));
    await this.saveOrgInitialState(project);

    for (const [resourceName, diffModel] of Object.entries(
      this.diffModel.files
    )) {
      const diffFilePath = join(diffPath, `${resourceName}.patch`);
      const patch = await this.downloadDiff(diffModel.url, diffFilePath);
      // TODO: project class should write patch into disk. That way, we don't need to worry after the file extension
      // We can
      // project.saveDiff(resourceName, patch)
      // const source = this.getOriginResource(project, resourceName);
      // this.saveFinalState(source, patch, finalStatePath);
    }
    // new DiffServer(project);
  }

  private async saveOrgInitialState(project: Project) {
    const beforeSnapshot = await this.getBeforeSnapshot();
    const beforeSnapshotContent = await beforeSnapshot.download();
    await project.refresh(beforeSnapshotContent);
    await beforeSnapshot.delete();
  }

  private async getBeforeSnapshot() {
    const resourcesToExport = buildResourcesToExport(this.resourcesToPreview);
    const snapshot = await SnapshotFactory.createFromOrg(
      resourcesToExport,
      this.orgId
    );
    return snapshot;
  }

  // private saveFinalState(source: string, patch: string, outputPath: string) {
  //   const finalStateContent = applyPatch(source, patch);
  //   writeFileSync(outputPath, finalStateContent);
  // }

  private getOriginResource(project: Project, resourceName: string) {
    try {
      return readFileSync(
        join(project.resourcePath, `${resourceName}.json`)
      ).toString();
    } catch (error) {
      throw 'TODO:';
    }
  }

  private async downloadDiff(
    diffUrl: string,
    outputFile: string
  ): Promise<string> {
    const {data} = await axios.get(diffUrl, {
      method: 'GET',
      responseType: 'blob',
    });
    writeFileSync(outputFile, data);
    return data;
  }

  private deleteOldestPreviews() {
    const getFilePath = (fileDirent: Dirent) =>
      join(this.previewDirectory, fileDirent.name);

    const allFiles = readdirSync(this.previewDirectory, {
      withFileTypes: true,
    });
    const dirs = allFiles.filter((potentialDir) => potentialDir.isDirectory());

    while (dirs.length >= SnapshotDiffReporter.previewHistorySize) {
      rmSync(getFilePath(dirs.shift()!), {
        recursive: true,
        force: true,
      });
    }
  }

  private get hasChanges() {
    return Object.keys(this.diffModel.files).length >= 0;
  }
}
