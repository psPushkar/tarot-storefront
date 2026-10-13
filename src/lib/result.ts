/**
 * The result envelope every API call returns.
 *
 * Lives in its own module so the demo dataset and the API client can both use
 * it without importing each other.
 */

import type { ApiErrorCode } from './types';

export interface ApiFailure {
  code: ApiErrorCode;
  /** HTTP status, or 0 when the request never reached the server. */
  status: number;
  message: string;
  /** Seconds to wait, parsed from `Retry-After` on a 429. */
  retryAfter?: number;
}

export type Result<T> =
  | { ok: true; data: T; demo: boolean }
  | { ok: false; error: ApiFailure };

export const ok = <T>(data: T, demo = false): Result<T> => ({ ok: true, data, demo });

export const fail = (error: ApiFailure): Result<never> => ({ ok: false, error });

/** Narrow a failure to one of a set of codes, for targeted UI branching. */
export function isCode(error: ApiFailure, ...codes: ApiErrorCode[]): boolean {
  return codes.includes(error.code);
}

/**
 * True when the failure means "the practitioner has not finished setting up",
 * rather than "something went wrong". These deserve a calm, explanatory state
 * instead of an error state.
 */
export function isNotReady(error: ApiFailure): boolean {
  return isCode(
    error,
    'payments_unavailable',
    'email_unavailable',
    'messaging_unavailable',
    'workspace_inactive',
    'not_configured',
  );
}

/** True when retrying later is plausibly useful. */
export function isTransient(error: ApiFailure): boolean {
  return isCode(error, 'network_error', 'timeout', 'server_error', 'rate_limited');
}

/** True when the caller must sign in (again) to proceed. */
export function isAuthFailure(error: ApiFailure): boolean {
  return isCode(error, 'missing_token', 'invalid_token', 'invalid_credentials');
}
