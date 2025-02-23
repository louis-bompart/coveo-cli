import {CLICommand} from '@coveo/cli-commons/command/cliCommand';
import {Flags} from '@oclif/core';
import {PushSource} from '@coveo/push-api-client';
import {AuthenticatedClient} from '@coveo/cli-commons/platform/authenticatedClient';
import {
  IsAuthenticated,
  Preconditions,
} from '@coveo/cli-commons/preconditions/index';
import dedent from 'ts-dedent';
import {green, red} from 'chalk';
import {
  AxiosResponse,
  errorMessage,
  successMessage,
} from '../../../lib/userFeedback';
import {Trackable} from '@coveo/cli-commons/preconditions/trackable';

export default class SourcePushDelete extends CLICommand {
  public static description =
    'Delete one or multiple items in a given Push source. See <https://docs.coveo.com/en/171> and <https://docs.coveo.com/en/131>';

  public static flags = {
    deleteOlderThan: Flags.string({
      char: 'd',
      exclusive: ['delete'],
      description:
        'If this flag is set, all items that have been added or updated in the source before the specified ISO 8601 date or Unix timestamp in milliseconds will be deleted. The documents will be deleted using the default queueDelay, meaning they will stay in the index for about 15 minutes after being marked for deletion.',
      helpValue: '2000-01-01T00:00:00-06:00 OR 1506700606240',
    }),
    delete: Flags.string({
      char: 'x',
      multiple: true,
      description:
        'The URIs of the items to delete. Can be repeated. If you want to delete more than one specific items, use the `source:push:batch` command instead.',
    }),
    deleteChildren: Flags.boolean({
      char: 'c',
      default: true,
      allowNo: true,
      description:
        'Whether to delete all items that share the same base URI as the specified item to delete.',
    }),
  };

  public static args = [
    {
      name: 'sourceId',
      required: true,
      description:
        'The identifier of the Push source on which to perform the delete operation. To retrieve the list of available Push source identifiers, use the `source:push:list` command.',
    },
  ];

  @Trackable()
  // TODO: Check privileges?
  @Preconditions(IsAuthenticated())
  public async run() {
    const {flags} = await this.parse(SourcePushDelete);
    if (!flags.deleteOlderThan && !flags.delete) {
      this.error(
        'You must minimally set the `delete` or the `deleteOlderThan` flag. Use `source:push:delete --help` to get more information.'
      );
    }
    const cfg = new AuthenticatedClient().cfg.get();
    const source = new PushSource(cfg.accessToken!, cfg.organization);

    if (flags.deleteOlderThan) {
      this.doDeletionOlderThan(source);
      return;
    }

    if (flags.delete) {
      if (await this.isNumberOfDeletionTooLarge()) {
        this.warn(
          dedent(
            'To delete large number of items, use the `source:push:batch` command instead.'
          )
        );
        return;
      }

      await this.doDeletionDocumentURI(source);
    }
  }

  private async isNumberOfDeletionTooLarge() {
    const {flags} = await this.parse(SourcePushDelete);
    return flags.delete!.length > 20;
  }

  private async doDeletionOlderThan(source: PushSource) {
    const {flags, args} = await this.parse(SourcePushDelete);
    const toDelete = `older than ${flags.deleteOlderThan}`;
    try {
      const isNumber = flags.deleteOlderThan?.match(/^\d+$/);

      const res = await source.deleteDocumentsOlderThan(
        args.sourceId,
        isNumber ? parseInt(flags.deleteOlderThan!, 10) : flags.deleteOlderThan!
      );
      this.successMessageOnDeletion(toDelete, res);
    } catch (e: unknown) {
      this.errorMessageOnDeletion(toDelete, e);
    }
  }

  private async doDeletionDocumentURI(source: PushSource) {
    const {flags, args} = await this.parse(SourcePushDelete);
    return Promise.all(
      flags.delete!.map(async (toDelete: string) => {
        try {
          const res = await source.deleteDocument(
            args.sourceId,
            toDelete,
            flags.deleteChildren
          );
          this.successMessageOnDeletion(toDelete, res);
        } catch (e: unknown) {
          this.errorMessageOnDeletion(toDelete, e);
        }
      })
    );
  }

  private errorMessageOnDeletion(toDelete: string, e: unknown) {
    return errorMessage(
      `Error while trying to delete document: ${red(toDelete)}.`,
      e
    );
  }

  private successMessageOnDeletion(toDelete: string, res: AxiosResponse) {
    return successMessage(
      `The delete request for document: ${green(
        toDelete
      )} was accepted by the Push API.`,
      res
    );
  }
}
