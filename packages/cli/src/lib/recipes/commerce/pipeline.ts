import PlatformClient, {
  MLModelCreated,
  NewPipelineModel,
} from '@coveord/platform-client';
import {CliUx} from '@oclif/core';
import {readFileSync} from 'fs-extra';
import {EOL} from 'os';
import {join} from 'path';
import dedent from 'ts-dedent';

export class Pipeline {
  private csvPath = join(__dirname, 'csv');
  private config: string;

  public constructor(name: string) {
    this.config = readFileSync(
      join(this.csvPath, 'base', `${name}.csv`)
    ).toString();
  }

  public toggleProductGrouping(productGroupingField: string | null) {
    if (!productGroupingField) {
      return this;
    }
    const path = join(this.csvPath, 'additions', 'productGrouping.csv');
    const groupingReplacementRegex = new RegExp('{{GROUPING_ID_FIELD}}', 'gm');
    this.replace(path, groupingReplacementRegex, productGroupingField);
    return this;
  }

  public linkCatalog(catalogId: string) {
    const path = join(this.csvPath, 'additions', 'catalog.csv');
    const replacementRegex = new RegExp('{{CATALOG_ID}}', 'gm');
    this.replace(path, replacementRegex, catalogId);
    return this;
  }

  public associate(model?: MLModelCreated) {
    if (model && model.modelId) {
      const path = join(this.csvPath, 'ml', `${model.engineId}.csv`);
      const replacementRegex = new RegExp('{{MODEL_ID}}', 'gm');
      this.replace(path, replacementRegex, model.modelId);
    }
    return this;
  }

  public async create(client: PlatformClient, pipelineModel: NewPipelineModel) {
    const {id: pipelineId} = await client.pipeline.create(pipelineModel);

    await client.pipeline.statements.importCSV(pipelineId, this.csv);
  }

  private replace(file: string, searchValue: RegExp, replaceValue: string) {
    try {
      const catalogConfig = readFileSync(file)
        .toString()
        .replace(searchValue, replaceValue);

      this.addToConfig(catalogConfig);
    } catch (error) {
      CliUx.ux.warn(
        dedent`Unexpected error while replacing ${searchValue} in file ${file}`
      );
      console.warn(error);
    }
    return this;
  }

  private addToConfig(newConfig: string) {
    this.config = this.config.concat(EOL, newConfig);
  }

  private get csv() {
    const header = readFileSync(join(this.csvPath, 'header.csv'));
    return [header, this.config].join(EOL);
  }
}
