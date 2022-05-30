import {Command} from '@oclif/core';
import {green} from 'chalk';
import {validate} from 'jsonschema';
import dedent from 'ts-dedent';
import {
  APIError,
  APIErrorSchema,
  AxiosErrorFromAPI,
  AxiosErrorFromAPISchema,
} from '../errors/APIError';
import {UnknownError} from '../errors/unknownError';

export interface AxiosResponse {
  status: number;
  statusText: string;
}

export const successMessage = (
  cmd: Command,
  tagLine: string,
  res?: AxiosResponse
) => {
  let message = dedent(`
      ${tagLine}
      `);
  if (res) {
    message += `Status code: ${green(res.status, res.statusText)}
    `;
  }
  cmd.log(message);
};

export const errorMessage = (
  cmd: Command,
  tagLine: string,
  e: unknown,
  options = {exit: false}
) => {
  const error = isAxiosApiError(e)
    ? new APIError(e, tagLine)
    : new UnknownError(e);

  if (options.exit) {
    throw error;
  } else {
    cmd.warn(error.message);
  }
};

function isAxiosApiError(error: unknown): error is AxiosErrorFromAPI {
  return validate(error, AxiosErrorFromAPISchema).valid;
}

// TODO: put somewhere else
function isApiError(error: unknown): error is APIError {
  return validate(error, APIErrorSchema).valid;
}

// FIXME: some API errors have to following format
// {
//   statusCode: 403,
//   message: 'Forbidden',
//   type: 'AccessDeniedException'
// }
// but we check for the error code property
// Fix the ApiError schema
export const ensureErrorIntegrity = (e: unknown, tagLine?: string) => {
  if (e instanceof Error) {
    return e;
  }
  return isApiError(e) ? new APIError(e) : new UnknownError(e);
};
