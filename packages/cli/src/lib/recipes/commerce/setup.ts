import {BuiltInTransformers} from '@coveo/push-api-client';
import PlatformClient, {
  ModelTypes,
  FieldModel,
  MLModelCreated,
  RegistrationModel,
} from '@coveord/platform-client';
import {CliUx} from '@oclif/core';
import {selectFieldModel} from '../../catalog/questions';
import {newTask, stopCurrentTask} from '../../utils/spinner';
import {RecommendationPipeline, SearchPipeline} from './pipeline';
import {mlTemplates} from './templates/mlModels';

export interface AdditionalFeatures {
  productGroupingField?: string;
}

export class PipelineConfigurator {
  private additionalFeatures: AdditionalFeatures = {};
  private MlMap: Map<ModelTypes, MLModelCreated> = new Map();
  public constructor(
    private client: PlatformClient,
    private fields: FieldModel[]
  ) {}

  public async configure(tag: string) {
    await this.askForAdditionalFeatures();
    newTask('Creating ML models');
    await this.createMlModels(tag);
    newTask('Configuring pipelines');
    // TODO: In the future, ask for the pipelines the user wants to create
    // await this.setupSearchPipeline(tag);
    await this.setupRecommendationPipeline();
    // await this.setupPDP(); // TODO: setup PDP
    stopCurrentTask();
  }

  /**
   * All async operations goes there
   */
  private async askForAdditionalFeatures() {
    await this.confirmProductGrouping();
  }

  private async createMlModels(tag: string) {
    const baseMlModels = [
      ModelTypes.TopClicks,
      ModelTypes.ECommerce,
      ModelTypes.QuerySuggest,
    ];

    for (const modelType of baseMlModels) {
      const model = mlTemplates.get(modelType);
      if (!model) continue;
      const registrationModel: RegistrationModel = {
        ...model,
        modelName: BuiltInTransformers.toLowerCase(`${tag} ${model.modelName}`),
        modelDisplayName: `${tag} ${model.modelDisplayName}`,
      };
      this.MlMap.set(
        modelType,
        await this.client.ml.register(registrationModel)
      );
    }
  }

  private async setupSearchPipeline(catalogId: string) {
    const pipelineConfig = new SearchPipeline(this.client);
    const mlTopClicks = this.MlMap.get(ModelTypes.TopClicks);
    const mlQureySuggest = this.MlMap.get(ModelTypes.QuerySuggest);

    await pipelineConfig
      .setCondition({definition: 'when not ( $recommendation isPopulated )'})
      .toggleProductGrouping(this.additionalFeatures.productGroupingField)
      .linkCatalog(catalogId)
      .associate(mlTopClicks)
      .associate(mlQureySuggest)
      .create();
  }

  private async setupRecommendationPipeline() {
    const pipelineConfig = new RecommendationPipeline(this.client);
    const recommendationModel = this.MlMap.get(ModelTypes.ECommerce);
    await pipelineConfig
      .setCondition({definition: 'when $recommendation isPopulated'})
      .associate(recommendationModel, 'popularbought')
      .associate(recommendationModel, 'frequentbought')
      .associate(recommendationModel, 'cart')
      .associate(recommendationModel, 'frequentviewed')
      .associate(recommendationModel, 'popularviewed')
      .associate(recommendationModel, 'user')
      .associate(recommendationModel, 'frequentviewedsamecategory')
      .create();
  }

  private async confirmProductGrouping() {
    this.additionalFeatures.productGroupingField = await this.confirmFeature(
      'Enable Product Grouping (https://docs.coveo.com/en/l78i2152)?',
      'Select your grouping field'
    );
  }

  private async confirmFeature(confirmMessage: string, question: string) {
    const enableProductGrouping = await CliUx.ux.confirm(
      `${confirmMessage} (y/n)`
    );
    if (!enableProductGrouping) {
      return;
    }
    const {name} = await selectFieldModel(question, this.fields);
    return name;
  }
}

// TODO: print the origin level and contex user should use in its interface
