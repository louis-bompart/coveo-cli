import PlatformClient, {
  ConditionModel,
  MLModelCreated,
  NewConditionModel,
  NewPipelineModel,
} from '@coveord/platform-client';
import {CliUx} from '@oclif/core';
import {readFileSync} from 'fs-extra';
import {EOL} from 'os';
import {join} from 'path';
import dedent from 'ts-dedent';

export class Pipeline {
  private config: string;
  private condition?: NewConditionModel;
  protected csvPath = join(__dirname, 'csv');

  public constructor(private client: PlatformClient, private name: string) {
    this.config = readFileSync(this.baseCsvPath).toString();
  }

  public setCondition(condition: NewConditionModel) {
    this.condition = condition;
    return this;
  }

  public associate(model?: MLModelCreated, strategy?: string) {
    if (model && model.modelId) {
      const modelName = `${model.engineId}${
        strategy ? '_'.concat(strategy) : ''
      }.csv`;
      const path = join(this.csvPath, 'ml', modelName);
      const replacementRegex = new RegExp('{{MODEL_ID}}', 'gm');
      this.replace(path, replacementRegex, model.modelId);
    }
    return this;
  }

  public async create(pipelineModel: NewPipelineModel) {
    const {id: pipelineId} = await this.client.pipeline.create({
      ...pipelineModel,
      condition: await this.getCondition(),
    });
    await this.client.pipeline.statements.importCSV(pipelineId, this.csv);
  }

  private async getCondition(): Promise<ConditionModel | undefined> {
    if (!this.condition) {
      return;
    }
    const existingConditions = await this.client.pipeline.conditions.list({
      filter: 'TODO:',
    });
    const condition = existingConditions.statements.find(
      (c) => c.definition === this.condition?.definition
    );
    if (condition) {
      return condition;
    } else {
      this.client.pipeline.conditions.create(this.condition);
    }
  }

  protected replace(file: string, searchValue: RegExp, replaceValue: string) {
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

  protected get baseCsvPath() {
    return join(this.csvPath, 'base', `${this.name}.csv`);
  }

  private addToConfig(newConfig: string) {
    this.config = this.config.concat(EOL, newConfig);
  }

  private get csv() {
    const header = readFileSync(join(this.csvPath, 'header.csv'));
    return [header, this.config].join(EOL);
  }
}

export class SearchPipeline extends Pipeline {
  public constructor(client: PlatformClient) {
    super(client, 'baseSearch');
  }

  public toggleProductGrouping(productGroupingField?: string) {
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

  public async create() {
    await super.create({
      name: 'Search',
      description: 'Main Search and Listing Pipeline',
    });
  }
}

export class RecommendationPipeline extends Pipeline {
  public constructor(client: PlatformClient) {
    super(client, 'baseRecommendation');
  }

  public async create() {
    await super.create({
      name: 'Recommendations',
      description: 'Home, PDP and Cart Recommendations',
    });
  }
}
