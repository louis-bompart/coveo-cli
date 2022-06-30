import PlatformClient, {
  CreateAssociation,
  FieldModel,
  MLModelCreated,
  RegistrationModel,
  NewPipelineModel,
} from '@coveord/platform-client';
import {CliUx} from '@oclif/core';
import {readFileSync} from 'fs-extra';
import {EOL} from 'os';
import {join} from 'path';
import {selectFieldModel} from '../../catalog/questions';
import {automaticRelevanceTuningAssociation} from './mlAssociations';
import {
  automaticRelevanceTuningModel,
  productRecommendationsModel,
  querySuggestModel,
} from './mlModels';

// TODO: check that the user can create all the following ML models. or add try catches on every call
export class OrgSetup {
  private productGroupingField: string | null = null;
  private MlMap: Map<RegistrationModel, MLModelCreated> = new Map();
  public constructor(
    private client: PlatformClient,
    private fields: FieldModel[]
  ) {}

  private async init() {
    // Ask all the questions now
    await this.confirmProductGrouping();

    await this.createMlModels();

    // Start configuration
    await this.setupSearchPipeline();
  }

  private async createMlModels() {
    const models = [
      automaticRelevanceTuningModel,
      productRecommendationsModel,
      querySuggestModel,
    ];
    for (const model of models) {
      this.MlMap.set(model, await this.client.ml.register(model));
    }
  }

  private async setupSearchPipeline() {
    // Configure pipeline
    const pipelineConfig = new PipelineConfig('baseSearch');
    const pipelineModel = {
      name: 'Search',
      description: 'Main Search and Listing Pipeline',
    };
    const modelId = this.MlMap.get(automaticRelevanceTuningModel)?.id; // TODO: not sure it is id or modelId
    if (!modelId) {
      throw 'TODO:';
    }
    pipelineConfig
      .toggleProductGrouping(this.productGroupingField)
      .linkCatalog('TODO: catalogId')
      .associate(automaticRelevanceTuningAssociation(modelId))
      .create(this.client, pipelineModel);
  }

  private async confirmProductGrouping() {
    const enableProductGrouping = await CliUx.ux.confirm(
      'Enable Product Grouping (https://docs.coveo.com/en/l78i2152)? (y/n)'
    );
    if (!enableProductGrouping) {
      return;
    }
    const {name} = await selectFieldModel(
      'Select your grouping field',
      this.fields
    );
    this.productGroupingField = name;
  }
}

export class PipelineConfig {
  private config: string;
  private mlAssociations: CreateAssociation[] = [];

  public constructor(name: string) {
    this.config = readFileSync(
      join(__dirname, 'base', `${name}.csv`)
    ).toString();
  }

  public toggleProductGrouping(productGroupingField: string | null) {
    if (!productGroupingField) {
      return this;
    }
    const groupingReplacementRegex = new RegExp('{{GROUPING_ID_FIELD}}', 'gm');
    const productGroupingConfig = readFileSync(
      join(__dirname, 'additions', 'productGrouping.csv')
    )
      .toString()
      .replace(groupingReplacementRegex, productGroupingField);

    this.config = this.config.concat(EOL, productGroupingConfig.toString());
    return this;
  }

  public linkCatalog(catalogId: string) {
    const replacementRegex = new RegExp('{{MY_CATALOG}}', 'gm');
    this.config = this.config.replace(replacementRegex, catalogId);
    return this;
  }

  public associate(association: CreateAssociation) {
    this.mlAssociations.push(association);
    return this;
  }

  public async create(client: PlatformClient, pipelineModel: NewPipelineModel) {
    const {id: pipelineId} = await client.pipeline.create(pipelineModel);

    await client.pipeline.statements.importCSV(pipelineId, this.config);
    // if (!modelId) {
    //   CliUx.ux.warn('cannot perform association.... TODO:');
    //   return;
    // }

    for (const association of this.mlAssociations) {
      await client.pipeline.associations.associate(pipelineId, association);
    }
  }
}

function getBasePipelineConfig(name: string) {
  return readFileSync(join(__dirname, 'base', `${name}.csv`)).toString();
}

async function setupRecommendationPipeline(
  client: PlatformClient,
  objectTypeToRecommend: string
) {
  // TODO: buildCSV
  const pipelineId = await createRecommendationPipeline(client);
  await client.pipeline.statements.importCSV(pipelineId, csvPath);
  //   TODO: associate ML models
}

async function createRecommendationPipeline(
  client: PlatformClient
): Promise<string> {
  throw 'TODO:';
}

export async function setupAdditionalOrgFeatures(client: PlatformClient) {}

// TODO: print the origin level and contex user should use in its interface
