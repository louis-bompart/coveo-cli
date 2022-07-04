// import type {CreateAssociation} from '@coveord/platform-client';
// export const automaticRelevanceTuningAssociation = (
//   modelId: string
// ): CreateAssociation => ({
//   cacheMaximumAge: 'PT10S',
//   enableWordCompletion: false,
//   exclusive: false,
//   intelligentTermDetection: false,
//   matchAdvancedExpression: true,
//   matchBasicExpression: true,
//   maxRecommendations: 25,
//   modelId,
//   rankingModifier: 250,
// });

// export const querySuggestModelAssociation = (
//   modelId: string
// ): CreateAssociation => ({
//   cacheMaximumAge: 'PT10S',
//   enableWordCompletion: false,
//   exclusive: false,
//   intelligentTermDetection: false,
//   matchAdvancedExpression: false,
//   matchBasicExpression: false,
//   maxRecommendations: 10,
//   modelId,
//   rankingModifier: 0,
// });

// export enum aaa {
//   ART = 'ds',
// }

// export const mlAssociationTemplates: Map<aaa, CreateAssociation> =
//   new Map().set(aaa.ART, {
//     cacheMaximumAge: 'PT10S',
//     enableWordCompletion: false,
//     exclusive: false,
//     intelligentTermDetection: false,
//     matchAdvancedExpression: true,
//     matchBasicExpression: true,
//     maxRecommendations: 25,
//     rankingModifier: 250,
//     useAdvancedConfiguration: true,
//   });
// const a = [
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_popularBought_la83xO }}',
//       customQueryParameters: {
//         submodel: 'popularBought',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 10,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: false,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'ProductRecommendations_5jFILt',
//   },
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_frequentViewed_EGAjFZ }}',
//       customQueryParameters: {
//         submodel: 'frequentViewed',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 10,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: false,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'ProductRecommendations_Ct46PA',
//   },
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_user_opzcaV }}',
//       customQueryParameters: {
//         submodel: 'user',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 10,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: false,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'ProductRecommendations_Jmk16G',
//   },
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_cart_KbMXUr }}',
//       customQueryParameters: {
//         submodel: 'cart',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 10,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: false,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'ProductRecommendations_aTbeVh',
//   },
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_frequentBought_OoK8ls }}',
//       customQueryParameters: {
//         submodel: 'frequentBought',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 10,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: false,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'ProductRecommendations_brFZpe',
//   },
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_popularViewed_XmXp27 }}',
//       customQueryParameters: {
//         submodel: 'popularViewed',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 10,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: false,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'ProductRecommendations_upoJp8',
//   },
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_frequentViewedDifferentCategory_kzEfFJ }}',
//       customQueryParameters: {
//         strategy: 'frequentViewedDifferentCategory',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 0,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: true,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'Product_Recommendation_TQ6ail',
//   },
//   {
//     model: {
//       cacheMaximumAge: 'PT10S',
//       condition:
//         '{{ QUERY_PIPELINE_CONDITION.when_recommendation_is_frequentViewedSameCategory_Yx0xOQ }}',
//       customQueryParameters: {
//         strategy: 'frequentViewedSameCategory',
//       },
//       enableWordCompletion: false,
//       exclusive: true,
//       intelligentTermDetection: false,
//       matchAdvancedExpression: false,
//       matchBasicExpression: false,
//       maxRecommendations: 0,
//       modelId: '{{ ML_MODEL.ProductRecommendations_ioV4So }}',
//       rankingModifier: 1000,
//       useAdvancedConfiguration: true,
//     },
//     parents: {
//       queryPipelineId: '{{ QUERY_PIPELINE.Recommendations_h11Con }}',
//     },
//     resourceName: 'Product_Recommendation_yCYkhl',
//   },
// ];
