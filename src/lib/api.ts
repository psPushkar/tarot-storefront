/**
 * Storefront API v1 client.
 *
 * Design rules this file obeys:
 *
 * 1. **It never throws for an expected failure.** Every call returns a
 *    discriminated `Result`, so a page can render a designed empty state
 *    instead of a stack trace. Only genuine programming errors escape.
 * 2. **Transport failures are normalised into API-shaped errors.** A DNS
 *    failure, a CORS rejection and a 500 all arrive at the caller as an
 *    `ApiFailure` with a stable `code`, so one code path handles them.
 * 3. **Unknown response fields are ignored, never rejected** — the reference
 *    states additive fields can appear within v1 at any time.
 * 4. **Demo mode short-circuits the network** so the site builds and looks
 *    finished before any credentials exist.
 */

import { config } from './config';
import * as demo from './demo';
import { fail, ok } from './result';
import type { ApiFailure, Result } from './result';
import type {
  AcceptedResult,
  ApiErrorCode,
  Availability,
  AvailabilityDays,
  Booking,
  CancelResult,
  CreateBookingRequest,
  CreatedBooking,
  Customer,
  Message,
  MeReading,
  Profile,
  Quote,
  QuoteRequest,
  Review,
  Service,
  ServiceDetail,
  Session,
  Workspace,
} from './types';

export type { ApiFailure, Result } from './result';
export { isAuthFailure, isCode, isNotReady, isTransient } from './result';

/* ── Credentials ───────────────────────────────────────────────────────── */

export interface Credentials {
  /** Bearer token for a signed-in customer. Required by `/me` routes. */
  customerToken?: string;
  /** Single-booking token returned to guests at checkout. */
  bookingToken?: string;
}

/* ── Transport ─────────────────────────────────────────────────────────── */

interface RequestOptions extends Credentials {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${config.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Reads an error envelope defensively. A gateway, proxy or WAF sitting in front
 * of the API can return HTML or an empty body with a 4xx/5xx status, so we can
 * never assume the failure is well-formed JSON.
 */
async function readError(response: Response): Promise<ApiFailure> {
  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) || undefined : undefined;

  let code: ApiErrorCode = 'server_error';
  let message = 'Something went wrong on our side.';

  try {
    const payload = (await response.json()) as { error?: { code?: string; message?: string } };
    if (payload?.error?.code) code = payload.error.code;
    if (payload?.error?.message) message = payload.error.message;
  } catch {
    // Body was not JSON. Fall back to a status-derived code so callers still
    // get something stable to branch on.
    if (response.status === 404) code = 'not_found';
    else if (response.status === 429) code = 'rate_limited';
    else if (response.status === 401) code = 'invalid_token';
    else if (response.status === 403) code = 'workspace_inactive';
    else if (response.status >= 500) code = 'server_error';
    else code = 'bad_request';
  }

  return { code, status: response.status, message, retryAfter };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<Result<T>> {
  if (!config.apiBaseUrl || !config.apiKey) {
    return fail({
      code: 'not_configured',
      status: 0,
      message: 'This site is not connected to a booking service yet.',
    });
  }

  const { method = 'GET', query, body, customerToken, bookingToken } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Key': config.apiKey,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (customerToken) headers['Authorization'] = `Bearer ${customerToken}`;
  if (bookingToken) headers['X-Booking-Token'] = bookingToken;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? config.timeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      // Availability and pricing must never be served from a cache.
      cache: 'no-store',
    });

    if (!response.ok) return fail(await readError(response));

    if (response.status === 204) return ok(undefined as T);

    const payload = (await response.json()) as { data?: T };
    if (payload === null || typeof payload !== 'object' || !('data' in payload)) {
      return fail({
        code: 'server_error',
        status: response.status,
        message: 'The booking service returned an unexpected response.',
      });
    }
    return ok(payload.data as T);
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return fail({
      code: aborted ? 'timeout' : 'network_error',
      status: 0,
      message: aborted
        ? 'The booking service took too long to answer.'
        : 'The booking service could not be reached.',
    });
  } finally {
    clearTimeout(timer);
  }
}

/* ── Catalogue (safe to cache / fetch at build time) ───────────────────── */

export function getWorkspace(): Promise<Result<Workspace>> {
  if (config.isDemo) return Promise.resolve(ok(demo.workspace, true));
  return request<Workspace>('/workspace');
}

export function getProfile(): Promise<Result<Profile>> {
  if (config.isDemo) return Promise.resolve(ok(demo.profile, true));
  return request<Profile>('/profile');
}

export function getServices(): Promise<Result<Service[]>> {
  if (config.isDemo) return Promise.resolve(ok(demo.services as Service[], true));
  return request<Service[]>('/services');
}

export function getService(slug: string): Promise<Result<ServiceDetail>> {
  if (config.isDemo) {
    const found = demo.services.find((s) => s.slug === slug);
    return Promise.resolve(
      found
        ? ok(found, true)
        : fail({ code: 'not_found', status: 404, message: 'Resource not found.' }),
    );
  }
  return request<ServiceDetail>(`/services/${encodeURIComponent(slug)}`);
}

export function getReviews(): Promise<Result<Review[]>> {
  if (config.isDemo) return Promise.resolve(ok(demo.reviews, true));
  return request<Review[]>('/reviews');
}

/* ── Availability (never cache) ────────────────────────────────────────── */

export function getAvailability(
  service: string,
  date?: string,
  timezone?: string,
): Promise<Result<Availability>> {
  if (config.isDemo) {
    return Promise.resolve(ok(demo.availabilityFor(service, date), true));
  }
  return request<Availability>('/availability', { query: { service, date, timezone } });
}

export function getAvailabilityDays(
  service: string,
  from?: string,
  to?: string,
): Promise<Result<AvailabilityDays>> {
  if (config.isDemo) {
    return Promise.resolve(ok(demo.availabilityDaysFor(service, from, to), true));
  }
  return request<AvailabilityDays>('/availability/days', { query: { service, from, to } });
}

/* ── Pricing ───────────────────────────────────────────────────────────── */

export function postQuote(body: QuoteRequest): Promise<Result<Quote>> {
  if (config.isDemo) return Promise.resolve(demo.quoteFor(body));
  return request<Quote>('/quote', { method: 'POST', body });
}

/* ── Booking ───────────────────────────────────────────────────────────── */

export function createBooking(
  body: CreateBookingRequest,
  credentials: Credentials = {},
): Promise<Result<CreatedBooking>> {
  if (config.isDemo) {
    return Promise.resolve(
      fail({
        code: 'payments_unavailable',
        status: 503,
        message: 'This is a preview of the site. Bookings are not being taken yet.',
      }),
    );
  }
  return request<CreatedBooking>('/bookings', { method: 'POST', body, ...credentials });
}

export function getBooking(uuid: string, credentials: Credentials): Promise<Result<Booking>> {
  return request<Booking>(`/bookings/${encodeURIComponent(uuid)}`, credentials);
}

export function cancelBooking(
  uuid: string,
  credentials: Credentials,
): Promise<Result<CancelResult>> {
  return request<CancelResult>(`/bookings/${encodeURIComponent(uuid)}/cancel`, {
    method: 'POST',
    ...credentials,
  });
}

export function rescheduleBooking(
  uuid: string,
  startAt: string,
  credentials: Credentials,
): Promise<Result<Booking>> {
  return request<Booking>(`/bookings/${encodeURIComponent(uuid)}/reschedule`, {
    method: 'POST',
    body: { start_at: startAt },
    ...credentials,
  });
}

/* ── Authentication ────────────────────────────────────────────────────── */

export function register(body: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<Result<AcceptedResult>> {
  return request<AcceptedResult>('/auth/register', { method: 'POST', body });
}

export function login(body: { email: string; password: string }): Promise<Result<Session>> {
  return request<Session>('/auth/login', { method: 'POST', body });
}

export function verifyEmail(token: string): Promise<Result<Session>> {
  return request<Session>('/auth/verify-email', { method: 'POST', body: { token } });
}

export function forgotPassword(email: string): Promise<Result<AcceptedResult>> {
  return request<AcceptedResult>('/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(token: string, password: string): Promise<Result<Session>> {
  return request<Session>('/auth/reset-password', { method: 'POST', body: { token, password } });
}

export function logout(customerToken: string): Promise<Result<{ signed_out: boolean }>> {
  return request<{ signed_out: boolean }>('/auth/logout', { method: 'POST', customerToken });
}

/* ── The signed-in customer ────────────────────────────────────────────── */

export function getMe(customerToken: string): Promise<Result<Customer>> {
  return request<Customer>('/me', { customerToken });
}

export function updateMe(
  customerToken: string,
  body: Partial<Pick<Customer, 'name' | 'phone' | 'birth_date' | 'birth_time' | 'birth_place'>>,
): Promise<Result<Customer>> {
  return request<Customer>('/me', { method: 'PATCH', body, customerToken });
}

export function changePassword(
  customerToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<Result<{ password_changed: boolean; sessions_revoked: boolean }>> {
  return request('/me/password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
    customerToken,
  });
}

export function getMyBookings(customerToken: string): Promise<Result<Booking[]>> {
  return request<Booking[]>('/me/bookings', { customerToken });
}

export function getMyBooking(customerToken: string, uuid: string): Promise<Result<Booking>> {
  return request<Booking>(`/me/bookings/${encodeURIComponent(uuid)}`, { customerToken });
}

export function getMyReadings(customerToken: string): Promise<Result<MeReading[]>> {
  return request<MeReading[]>('/me/readings', { customerToken });
}

export function getMessages(customerToken: string, uuid: string): Promise<Result<Message[]>> {
  return request<Message[]>(`/me/bookings/${encodeURIComponent(uuid)}/messages`, {
    customerToken,
  });
}

export function postMessage(
  customerToken: string,
  uuid: string,
  body: string,
): Promise<Result<{ posted: boolean }>> {
  return request<{ posted: boolean }>(`/me/bookings/${encodeURIComponent(uuid)}/messages`, {
    method: 'POST',
    body: { body },
    customerToken,
  });
}

/* ── Contact ───────────────────────────────────────────────────────────── */

export function postContact(body: {
  name: string;
  email: string;
  message: string;
  /** Honeypot. Must be sent empty from a real form. */
  website?: string;
}): Promise<Result<{ sent: boolean }>> {
  if (config.isDemo) {
    return Promise.resolve(
      fail({
        code: 'email_unavailable',
        status: 503,
        message: 'This is a preview of the site. Messages are not being delivered yet.',
      }),
    );
  }
  return request<{ sent: boolean }>('/contact', { method: 'POST', body: { website: '', ...body } });
}
