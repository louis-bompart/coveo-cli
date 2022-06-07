import {bold, red, green} from 'chalk';
import {
  CatalogConfigurationModel,
  PlatformClient,
  SourceType,
  CreateSourceModel,
  FieldModel,
} from '@coveord/platform-client';
import {CliUx, Command, Flags} from '@oclif/core';
import {
  HasNecessaryCoveoPrivileges,
  IsAuthenticated,
  Preconditions,
} from '../../../lib/decorators/preconditions';
import {Trackable} from '../../../lib/decorators/preconditions/trackable';
import {AuthenticatedClient} from '../../../lib/platform/authenticatedClient';
import {
  selectCatalogStructure,
  selectField,
  selectObjectTypeField,
} from '../../../lib/catalog/questions';
import {Configuration} from '../../../lib/config/config';
import {catalogConfigurationUrl} from '../../../lib/platform/url';
import {withSourceVisibility} from '../../../lib/flags/sourceCommonFlags';
import {getDocumentFieldsAndObjectTypeValues} from '../../../lib/catalog/parse';
import dedent from 'ts-dedent';
import {without} from '../../../lib/utils/list';
import {
  DocumentParseResult,
  PartialCatalogConfigurationModel,
} from '../../../lib/catalog/interfaces';
import {getCatalogPartialConfiguration} from '../../../lib/catalog/detect';

export default class CatalogCreate extends Command {
  public static description = `${bold.bgYellow(
    '(alpha)'
  )} Create a commerce catalog interactively along with necessary sources`;

  public static flags = {
    ...withSourceVisibility(),
    output: Flags.boolean({
      char: 'o',
      default: false,
      description: 'Whether to output Catalog configuration',
    }),
    dataFiles: Flags.string({
      multiple: true,
      char: 'f',
      required: true,
      helpValue: 'products.json availabilities.json',
      // TODO: support folders as well.
      description:
        'Combinaison of JSON files (containing JSON files) to push. Can be repeated.',
    }),
  };

  public static hidden = true;

  public static args = [
    {
      name: 'name',
      description:
        // TODO: check for catalog name uniqueness before doing destructive changes
        "The catalog name must be unique. Editing an existing catalog's name will cause all search interfaces referencing it to cease working.",
      required: true,
    },
  ];

  @Trackable()
  @Preconditions(
    IsAuthenticated(),
    HasNecessaryCoveoPrivileges()
    // TODO: Add edit catalog privilege. https://docs.coveo.com/en/2956/coveo-for-commerce/index-commerce-catalog-content-with-the-stream-api#required-privileges
  )
  public async run() {
    const {flags} = await this.parse(CatalogCreate);
    const authenticatedClient = new AuthenticatedClient();
    const client = await authenticatedClient.getClient();
    const configuration = authenticatedClient.cfg.get();
    const fieldsAndObjectTypes = await getDocumentFieldsAndObjectTypeValues(
      client,
      flags.dataFiles
    );
    const catalogConfigurationModel = await this.generateCatalogConfiguration(
      fieldsAndObjectTypes
    );

    await this.ensureCatalogValidity();

    // Destructive changes starting from here
    const {productSourceId, catalogSourceId} = await this.createSources(
      client,
      catalogConfigurationModel
    );
    CliUx.ux.action.start('Creating catalog');
    const {id: catalogConfigurationId} = await this.createCatalogConfiguration(
      client,
      catalogConfigurationModel
    );
    const catalog = await this.createCatalog(
      client,
      catalogConfigurationId,
      productSourceId,
      catalogSourceId
    );

    CliUx.ux.action.start('Configuring Catalog fields');
    await this.ensureCatalogFields(
      client,
      catalogConfigurationModel,
      fieldsAndObjectTypes.fields
    );

    await this.mapStandardFields(
      productSourceId,
      catalogConfigurationId,
      configuration
    );

    if (flags.output) {
      CliUx.ux.styledJSON(catalog);
    }
  }

  @Trackable()
  public async catch(err?: Error & {exitCode?: number}) {
    throw err;
  }

  protected async finally(err: Error | undefined) {
    CliUx.ux.action.stop(err ? red.bold('!') : green('✔'));
  }

  private async ensureCatalogFields(
    client: PlatformClient,
    catalogConfigurationModel: PartialCatalogConfigurationModel,
    missingFields: FieldModel[]
  ) {
    const fieldsToCreate: FieldModel[] = [];
    const fieldsToUpdate: FieldModel[] = [];
    const updateField = (field: FieldModel) => ({
      ...field,
      multiValueFacet: true,
      multiValueFacetTokenizers: ';',
      useCacheForNestedQuery: true,
    });

    // Get Id fields from catalog configuration
    for (const {idField} of Object.values(catalogConfigurationModel)) {
      const missing = missingFields.find((field) => field.name === idField);
      if (missing) {
        fieldsToCreate.push(updateField(missing));
      } else {
        const existing = await client.field.get(idField);
        fieldsToUpdate.push(updateField(existing));
      }
    }

    if (fieldsToCreate.length > 0) {
      await client.field.createFields(fieldsToCreate);
    }
    if (fieldsToUpdate.length > 0) {
      await client.field.updateFields(fieldsToUpdate);
    }
  }

  private async generateCatalogConfiguration(
    fieldsAndObjectTypes: DocumentParseResult
  ): Promise<PartialCatalogConfigurationModel> {
    const {flags} = await this.parse(CatalogCreate);
    try {
      CliUx.ux.action.start('Generating catalog configuration from data');
      return getCatalogPartialConfiguration(flags.dataFiles);
    } catch (error) {
      CliUx.ux.action.stop('failed');
      CliUx.ux.warn(
        dedent`Unable to automatically generate catalog configuration from data.
        Please answer the following questions`
      );
    }
    return this.generateCatalogConfigurationInteractively(fieldsAndObjectTypes);
  }

  private async generateCatalogConfigurationInteractively(
    fieldsAndObjectTypes: DocumentParseResult
  ): Promise<PartialCatalogConfigurationModel> {
    let {objectTypeValues} = fieldsAndObjectTypes;
    const fieldnames: string[] = fieldsAndObjectTypes.fields.map(
      (field) => `${field.name}`
    );
    const {variants, availabilities} = await selectCatalogStructure(
      objectTypeValues
    );
    const productObjectType = await selectObjectTypeField(
      'product',
      objectTypeValues
    );
    const productIdField = await selectField(
      `Select your Product ${variants ? 'ID' : 'SKU'} field`,
      fieldnames
    );
    objectTypeValues = without(objectTypeValues, [productObjectType]);
    const model: PartialCatalogConfigurationModel = {
      product: {
        objectType: productObjectType,
        idField: productIdField,
      },
    };

    if (variants) {
      const variantObjectType = await selectObjectTypeField(
        'variant',
        objectTypeValues
      );
      const variantIdField = await selectField(
        'Select your Product SKU field',
        fieldnames
      );
      objectTypeValues = without(objectTypeValues, [variantObjectType]);
      model.variant = {
        objectType: variantObjectType,
        idField: variantIdField,
      };
    }

    if (availabilities) {
      model.availability = {
        objectType: await selectObjectTypeField(
          'availability',
          objectTypeValues
        ),
        idField: await selectField(
          'Select your Availability ID field',
          fieldnames
        ),
        availableSkusField: await selectField(
          'Select your Available SKUs field',
          fieldnames
        ),
      };
    }

    return model;
  }

  private async mapStandardFields(
    sourceId: string,
    catalogConfigurationId: string,
    configuration: Configuration
  ) {
    // TODO: try to automap standard fields with similar name
    const url = catalogConfigurationUrl(
      sourceId,
      catalogConfigurationId,
      configuration
    );
    CliUx.ux.log(`To map standard fields visit ${url}`);
  }

  /**
   * (Optional for phase 0)
   * Parse data a second time to see if the provided inputs from the user can generate a valid catalog
   * This would prevent going forward with a broken/invalid catalog.
   */
  private async ensureCatalogValidity() {
    return;
  }

  private async createCatalogConfiguration(
    client: PlatformClient,
    model: PartialCatalogConfigurationModel
  ): Promise<CatalogConfigurationModel> {
    const {args} = await this.parse(CatalogCreate);
    return client.catalogConfiguration.create({
      ...model,
      name: `${args.name}-configuration`,
      // Field mappings can later be defined in the Admin UI.
      fieldsMapping: {},
    });
  }

  private async createSources(
    client: PlatformClient,
    catalogConfigurationModel: PartialCatalogConfigurationModel
  ) {
    let productSourceId = undefined;
    let catalogSourceId = undefined;
    const {args, flags} = await this.parse(CatalogCreate);
    CliUx.ux.action.start('Creating product source');
    productSourceId = await this.createCatalogSource(client, {
      name: `${args.name}`,
      sourceVisibility: flags.sourceVisibility,
    });

    if (catalogConfigurationModel.availability) {
      CliUx.ux.action.start('Creating availability source');
      catalogSourceId = await this.createCatalogSource(client, {
        name: `${args.name} Availabilities`,
        sourceVisibility: flags.sourceVisibility,
      });
    }

    return {
      productSourceId,
      catalogSourceId,
    };
  }

  private async createCatalogSource(
    client: PlatformClient,
    overwriteModel?: CreateSourceModel
  ) {
    const {id} = await client.source.create({
      sourceType: SourceType.CATALOG,
      pushEnabled: true,
      streamEnabled: true,
      ...overwriteModel,
    });
    return id;
  }

  private async createCatalog(
    client: PlatformClient,
    catalogConfigurationId: string,
    sourceId: string,
    availabilitySourceId?: string
  ) {
    const {args} = await this.parse(CatalogCreate);
    return client.catalog.create({
      catalogConfigurationId,
      name: args.name,
      sourceId,
      availabilitySourceId,
      description: 'Created by the Coveo CLI',
    });
  }
}
