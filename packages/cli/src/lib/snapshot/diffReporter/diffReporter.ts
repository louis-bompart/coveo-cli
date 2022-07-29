import http from 'node:http';
import {
  ResourceSnapshotsReportModel,
  ResourceSnapshotType,
  SnapshotDiffModel,
} from '@coveord/platform-client';
import {CliUx} from '@oclif/core';
import axios from 'axios';
import {green} from 'chalk';
import {
  mkdirSync,
  existsSync,
  readdirSync,
  writeFileSync,
  Dirent,
  rmSync,
} from 'fs-extra';
import {join, resolve} from 'path';
import {DiffFile} from 'diff2html/lib/types';
import {buildResourcesToExport} from '../pullModel/validation/model';
import {SnapshotFactory} from '../snapshotFactory';
import {Snapshot} from '../snapshot';
import {Project} from '../../project/project';
import {DiffServer} from './server/server';
1;
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
      report.resourceOperationResults
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

    mkdirSync(dirPath, {
      recursive: true,
    });

    const project = new Project(resolve(dirPath));
    await this.saveOrgInitialState(project);

    const list: DiffFile[] = [];
    for (const [resourceName, diffModel] of Object.entries(
      this.diffModel.files
    )) {
      const diffFilePath = join(dirPath, `${resourceName}.patch`);
      const diff = await this.downloadDiff(diffModel.url, diffFilePath);
      list.push(...parse(diff));
      // await this.generateHtmlFromDiff(diff);
    }

    // TODO: PASS THE FILES TO THE STATIC PAGE AND RENDER FROM THERE. THAT WAY, WE CAN ADD A LINE LIMIT INSTEAD OF GENERATING AN ENTIRE HTML DIFF
    await this.startHttpServer(project.resourcePath, dirPath);

    // TODO: open HTML in browser
    CliUx.ux.action.stop(green('✔'));
  }

  private startHttpServer(projectPath: string, diffFilePath: string) {
    const server = new DiffServer(projectPath, diffFilePath);
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

  private async generateHtmlFromDiff(diff: string) {
    throw 'TODO:';
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
