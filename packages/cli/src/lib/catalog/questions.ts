import {filter, FilterResult} from 'fuzzy';
import {bold} from 'chalk';
import inquirer from 'inquirer';
import autocompletePrompt from 'inquirer-autocomplete-prompt';
import {Plurable, pluralizeIfNeeded} from '../utils/string';

// Catalog Id field step
// - Select the value attributed to your Product object type.
// - Select your Product ID field (if no variant is selected, ask "select your product SKU field")
// - The product ID is used to link the product to its variant. The field must appear on both types of objects. (if no variant is selected, ask "The SKU is used to identify each sellable unit.")
// Prompt for product Id field and obejct type

// if (catalogStructure.variant) {
// - Select the value attributed to your Variant object type.
// - Select your Product SKU field
// - The SKU is used to identify each sellable unit.
//   // Prompt for variant Id field and obejct type
// }

// if (catalogStructure.availabilities) {
//   // Prompt for availabilities Id field and obejct type
// }

// TODO: CDX-978: prompt user for source ids. If the there are no sources in the org, create them

export interface CatalogStructure {
  products: boolean;
  variants: boolean;
  availabilities: boolean;
}

export const defaultCatalogStructure: CatalogStructure = {
  products: true,
  variants: false,
  availabilities: false,
};

export async function selectCatalogStructure(
  objectTypeValues: string[]
): Promise<CatalogStructure> {
  if (objectTypeValues.length === 1) {
    return defaultCatalogStructure;
  }

  const typePluralized = pluralizeIfNeeded(
    ['type', 'types'],
    objectTypeValues.length - 1
  );
  const answer = await inquirer.prompt({
    message: `Select the object ${typePluralized} your catalog should include`,
    name: 'objectTypes',
    type: objectTypeValues.length === 2 ? 'list' : 'checkbox',
    choices: [
      {name: 'Variants', value: 'variants'},
      {name: 'Availabilities', value: 'availabilities'},
    ],
  });
  const objectTypeArray = [answer.objectTypes].flatMap((o) => o);
  return {
    ...defaultCatalogStructure,
    variants: objectTypeArray.includes('variants'),
    availabilities: objectTypeArray.includes('availabilities'),
  };
}

export async function selectObjectTypeField(
  objectType: 'product' | 'variant' | 'availability', // TODO: find a type
  fields: string[]
): Promise<string> {
  const answer = await inquirer.prompt({
    message: `Select the value attributed to your ${bold(
      objectType
    )} object type.`,
    name: 'fieldName',
    type: 'autocomplete',
    source: (_answersSoFar: string, input: string) => {
      const results = filter(input, fields);
      return results.map((v) => v.string || v);
    },
  });
  // Dirty mutation of the array parameter to prevent proposing already selected option in future questions
  // fields = fields.filter((f) => f !== answer.fieldName);
  return answer.fieldName;
}

export async function selectIdField(
  message: string,
  fields: string[]
): Promise<string> {
  const answer = await inquirer.prompt({
    message,
    name: 'fieldName',
    type: 'autocomplete',
    source: (_answersSoFar: string, input: string) => {
      const results = filter(input, fields);
      return results.map((v) => v.string || v);
    },
  });
  return answer.fieldName;
}

async function main() {
  inquirer.registerPrompt('autocomplete', autocompletePrompt);
  const a = await selectObjectTypeField('product', [
    'allo',
    'allodsa',
    'fgallodfd',
    'fgsdghdfdgh',
    'fgsdghdfdghdgh',
    'fgsdghdf',
    'vbsdfgqw',
  ]);
  console.log('*********************');
  console.log(a);
  console.log('*********************');
}

main();
