/**
 * Browser-side credential storage.
 *
 * Two quite different things are kept here and they are deliberately stored
 * differently:
 *
 *  - The **customer token** is a durable sign-in. It lives in `localStorage`
 *    with its expiry, and is cleared the moment it lapses.
 *  - A **booking token** is a guest's single-booking key, shown exactly once at
 *    checkout. Losing it means losing access to the booking, so it is written to
 *    `localStorage` too — but keyed per booking, never merged into an account.
 *
 * Every function is safe to call during SSR: `window` is checked first, and a
 * `localStorage` that throws (Safari private mode, blocked third-party storage)
 * degrades to no persistence rather than an exception.
 */

const CUSTOMER_KEY = 'storefront.customer';
const BOOKINGS_KEY = 'storefront.bookings';
const LAST_BOOKING_KEY = 'storefront.lastBooking';

interface StoredSession {
  token: string;
  expiresAt: string;
  name: string;
  email: string;
}

export interface LastBooking {
  id: string;
  token?: string;
  serviceSlug: string;
  startAt: string;
}

function store(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  const storage = store();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  const storage = store();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private-mode failure. The site still works, the visitor is just
    // asked to sign in again — which is the correct trade rather than crashing.
  }
}

function remove(key: string): void {
  const storage = store();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* nothing useful to do */
  }
}

/* ── Customer session ──────────────────────────────────────────────────── */

export function saveSession(session: {
  token: string;
  expires_at: string;
  customer: { name: string; email: string };
}): void {
  write(CUSTOMER_KEY, {
    token: session.token,
    expiresAt: session.expires_at,
    name: session.customer.name,
    email: session.customer.email,
  } satisfies StoredSession);
}

export function getSession(): StoredSession | null {
  const session = read<StoredSession>(CUSTOMER_KEY);
  if (!session?.token) return null;

  // An expired token is worse than no token: it produces a confusing 401 on a
  // page that looks signed in. Drop it eagerly.
  if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
    remove(CUSTOMER_KEY);
    return null;
  }
  return session;
}

export function getCustomerToken(): string | undefined {
  return getSession()?.token ?? undefined;
}

export function clearSession(): void {
  remove(CUSTOMER_KEY);
}

/* ── Guest booking tokens ──────────────────────────────────────────────── */

export function saveBookingToken(bookingId: string, token: string): void {
  const all = read<Record<string, string>>(BOOKINGS_KEY) ?? {};
  all[bookingId] = token;
  write(BOOKINGS_KEY, all);
}

export function getBookingToken(bookingId: string): string | undefined {
  const all = read<Record<string, string>>(BOOKINGS_KEY) ?? {};
  return all[bookingId];
}

export function listBookingIds(): string[] {
  return Object.keys(read<Record<string, string>>(BOOKINGS_KEY) ?? {});
}

/* ── The booking just created ──────────────────────────────────────────── */

/**
 * Written immediately before redirecting to the payment provider. The provider
 * returns the visitor to a fixed `success_url` that cannot contain the booking
 * id — it does not exist when the URL is submitted — so the confirmation page
 * recovers it from here.
 */
export function saveLastBooking(booking: LastBooking): void {
  write(LAST_BOOKING_KEY, booking);
  if (booking.token) saveBookingToken(booking.id, booking.token);
}

export function getLastBooking(): LastBooking | null {
  return read<LastBooking>(LAST_BOOKING_KEY);
}

export function clearLastBooking(): void {
  remove(LAST_BOOKING_KEY);
}

/**
 * Resolve credentials for a booking from every place they might live: an
 * explicit token in the URL (how payment providers return the visitor), the
 * stored guest token, or the signed-in customer.
 */
export function credentialsForBooking(
  bookingId: string,
  urlToken?: string | null,
): { customerToken?: string; bookingToken?: string } {
  const bookingToken = urlToken || getBookingToken(bookingId);
  const customerToken = getCustomerToken();
  return { bookingToken: bookingToken || undefined, customerToken };
}
