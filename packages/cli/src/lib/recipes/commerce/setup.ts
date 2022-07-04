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
import {Pipeline} from './pipeline';
import {mlTemplates} from './templates/mlModels';

// TODO: check that the user can create all the following ML models. or add try catches on every call
export class PipelineConfigurator {
  private productGroupingField: string | null = null;
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
    await this.setupSearchPipeline(tag);
    // await this.setupRecommendationPipeline();
    stopCurrentTask();
  }

  /**
   * All async operations goes there
   */
  private async askForAdditionalFeatures() {
    await this.confirmProductGrouping();
    // TODO: ask for DNE
    // if DNE add facetsence to this.MlMap
  }

  private async createMlModels(tag: string) {
    for (const [modelType, model] of mlTemplates.entries()) {
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
    const pipelineConfig = new Pipeline('baseSearch');
    const mlTopClicks = this.MlMap.get(ModelTypes.TopClicks);
    const mlQureySuggest = this.MlMap.get(ModelTypes.QuerySuggest);
    const mlFacetSense = this.MlMap.get(ModelTypes.FacetSense);
    const pipelineModel = {
      name: 'Search',
      description: 'Main Search and Listing Pipeline',
    };

    await pipelineConfig
      .toggleProductGrouping(this.productGroupingField)
      .linkCatalog(catalogId) // TODO: create a subclass for each pipeline
      .associate(mlTopClicks)
      .associate(mlQureySuggest)
      .associate(mlFacetSense)
      .create(this.client, pipelineModel);
  }

  private async setupRecommendationPipeline() {
    // TODO:
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

// TODO: print the origin level and contex user should use in its interface
