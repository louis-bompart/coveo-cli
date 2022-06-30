import {IntervalUnit, RegistrationModel} from '@coveord/platform-client';

export const automaticRelevanceTuningModel: RegistrationModel = {
  modelName: 'ART', // TODO: should be dynamic
  commandLineParameters: ['--conf', 'coveo.drill.filterOutEmptyQueries=false'],
  commonFilter: '',
  customEventFilter: '',
  engineId: 'topclicks',
  exportOffset: 'PT0S',
  exportPeriod: 'P3M',
  intervalTime: 1,
  intervalUnit: IntervalUnit.DAY,
  modelDisplayName: 'ART', // TODO: should be dynamic
  searchEventFilter: "(originLevel1=~'MainSearch' OR originLevel1=~'Listing')", // TODO: return hubs to the user
  viewEventFilter: '',
};

export const productRecommendationsModel: RegistrationModel = {
  modelName: 'ProductRecommendations', // TODO: should be dynamic
  commandLineParameters: [],
  commonFilter: '',
  customEventFilter: '',
  engineId: 'ecommerce',
  exportOffset: 'PT0S',
  exportPeriod: 'P3M',
  intervalTime: 1,
  intervalUnit: IntervalUnit.DAY,
  modelDisplayName: 'ProductRecommendations', // TODO: should be dynamic
  searchEventFilter: '',
  viewEventFilter: '',
};

export const querySuggestModel: RegistrationModel = {
  modelName: 'QuerySuggest', // TODO: should be dynamic
  commandLineParameters: [],
  commonFilter: '',
  customEventFilter: '',
  engineId: 'querysuggest',
  exportOffset: 'PT0S',
  exportPeriod: 'P3M',
  intervalTime: 1,
  intervalUnit: IntervalUnit.DAY,
  modelDisplayName: 'QuerySuggest', // TODO: should be dynamic
  searchEventFilter: '',
  viewEventFilter: '',
};
