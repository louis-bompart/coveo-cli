import type {CreateAssociation} from '@coveord/platform-client';
export const automaticRelevanceTuningAssociation = (
  modelId: string
): CreateAssociation => ({
  cacheMaximumAge: 'PT10S',
  enableWordCompletion: false,
  exclusive: false,
  intelligentTermDetection: false,
  matchAdvancedExpression: true,
  matchBasicExpression: true,
  maxRecommendations: 25,
  modelId,
  rankingModifier: 250,
});
