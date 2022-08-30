import {CliUx, Command} from '@oclif/core';
import {CLIBaseError, SeverityLevel} from './lib/errors/CLIBaseError';
import {Trackable} from './lib/decorators/preconditions/trackable';
import {stopSpinner} from './lib/utils/ux';
import {wrapError} from './lib/errors/wrapError';
import {noop} from './lib/utils/misc';

export abstract class CliCommand extends Command {
  public abstract run(): PromiseLike<any>;

  @Trackable()
  protected async catch(err?: any): Promise<CLIBaseError> {
    // Let oclif handle exit signal errors.
    if (err.code === 'EEXIT') {
      return super.catch(err);
    }

    // Debug raw error
    this.debug(err);

    // Convert all other errors to CLIBaseErrors for consistency
    const error = wrapError(err);

    this.isFatalError(error)
      ? this.handleFatalError(error)
      : this.handleNonFatalError(error);
    return error;
  }

  protected async finally(err: Error | undefined) {
    try {
      stopSpinner(err);
    } catch {
      noop();
    }

    return super.finally(err);
  }

  private isFatalError(error: CLIBaseError): boolean {
    return error.severityLevel === SeverityLevel.Error;
  }

  private handleNonFatalError(error: CLIBaseError) {
    CliUx.ux.log();
    CliUx.ux[error.severityLevel]('\n' + error.message);
  }

  private handleFatalError(error: CLIBaseError) {
    // Let oclif handle errors
    super.catch(error);
  }
}
