import {
  IntervalUnit,
  ModelTypes,
  RegistrationModel,
} from '@coveord/platform-client';

export const mlTemplates: Map<ModelTypes, RegistrationModel> = new Map()
  .set(ModelTypes.TopClicks, {
    modelName: 'ART',
    commandLineParameters: [
      '--conf',
      'coveo.drill.filterOutEmptyQueries=false',
    ],
    commonFilter: '',
    customEventFilter: '',
    engineId: 'topclicks',
    exportOffset: 'PT0S',
    exportPeriod: 'P3M',
    intervalTime: 1,
    intervalUnit: IntervalUnit.DAY,
    modelDisplayName: 'ART',
    searchEventFilter:
      "(originLevel1=~'MainSearch' OR originLevel1=~'Listing')", // TODO: return hubs to the user
    viewEventFilter: '',
  })
  .set(ModelTypes.ECommerce, {
    modelName: 'ProductRecommendations',
    commandLineParameters: [],
    commonFilter: '',
    customEventFilter: '',
    engineId: 'ecommerce',
    exportOffset: 'PT0S',
    exportPeriod: 'P3M',
    intervalTime: 1,
    intervalUnit: IntervalUnit.DAY,
    modelDisplayName: 'ProductRecommendations',
    searchEventFilter: '',
    viewEventFilter: '',
  })
  .set(ModelTypes.QuerySuggest, {
    modelName: 'QuerySuggest',
    commandLineParameters: [],
    commonFilter: '',
    customEventFilter: '',
    engineId: 'querysuggest',
    exportOffset: 'PT0S',
    exportPeriod: 'P3M',
    intervalTime: 1,
    intervalUnit: IntervalUnit.DAY,
    modelDisplayName: 'QuerySuggest',
    searchEventFilter: '',
    viewEventFilter: '',
  });
