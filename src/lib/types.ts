/**
 * Type definitions for Storefront API v1.
 *
 * Additive fields can appear within v1 at any time, so every interface here is
 * treated as a *minimum* shape — unknown fields are ignored rather than causing
 * a failure. Nothing in this file assumes a field exists unless the reference
 * marks it as always present.
 */

/* ── Money ─────────────────────────────────────────────────────────────── */

/** Integer minor units. `4550` + `USD` is $45.50. */
export type Cents = number;

/** ISO-4217 code, e.g. `EUR`. */
export type CurrencyCode = string;

/* ── Workspace and profile ─────────────────────────────────────────────── */

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  plan: string;
}

export interface ProfileSocials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
}

export interface ProfileBranding {
  primary_color?: string;
  theme?: string;
  font?: string;
}

export interface ProfilePolicies {
  cancellation?: string;
  refund?: string;
  disclaimer?: string;
}

export interface ProfileBooking {
  min_notice_hours?: number;
  max_horizon_days?: number;
}

export interface ProfileVacation {
  active: boolean;
  message?: string;
  /** `YYYY-MM-DD` or empty. */
  until?: string;
}

export interface Profile {
  site_name: string;
  display_name: string;
  tagline: string;
  bio: string;
  /** Storage key, not a URL. Serve via `/uploads/<key>` on the deployment. */
  photo_key?: string;
  logo_key?: string;
  timezone: string;
  currency: CurrencyCode;
  languages?: string[];
  specialties?: string[];
  socials?: ProfileSocials;
  branding?: ProfileBranding;
  policies?: ProfilePolicies;
  booking?: ProfileBooking;
  vacation?: ProfileVacation;
}

/* ── Catalogue ─────────────────────────────────────────────────────────── */

export type ServiceType = 'live_video' | 'phone' | 'recorded' | 'written';
export type IntakeType = 'generic' | 'astrology' | 'numerology' | 'tarot';

export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_min: number;
  price_cents: Cents;
  currency: CurrencyCode;
  type: ServiceType;
  intake_type: IntakeType;
}

export interface Addon {
  id: string;
  title: string;
  price_cents: Cents;
}

export interface IntakeQuestion {
  id: string;
  question: string;
  required: boolean;
}

export interface ServiceDetail extends Service {
  /** Omitted by the API when empty. */
  addons?: Addon[];
  questions?: IntakeQuestion[];
}

export interface Review {
  rating: number;
  comment: string;
  created_at: string;
}

/* ── Availability ──────────────────────────────────────────────────────── */

export interface Slot {
  /** RFC 3339 UTC. This exact value is what `POST /bookings` expects. */
  start_at: string;
  end_at: string;
  /** Pre-formatted wall-clock time in the requested timezone. */
  label: string;
}

export interface Availability {
  date: string;
  service: string;
  slots: Slot[];
}

export interface AvailabilityDay {
  date: string;
  slot_count: number;
  available: boolean;
}

export interface AvailabilityDays {
  service: string;
  days: AvailabilityDay[];
}

/* ── Pricing ───────────────────────────────────────────────────────────── */

export type AdjustmentType = 'addon' | 'region' | 'coupon' | 'rounding' | (string & {});

export interface QuoteAdjustment {
  type: AdjustmentType;
  label: string;
  /** Negative values are discounts. */
  delta_cents: Cents;
}

export interface Quote {
  service: string;
  currency: CurrencyCode;
  /** Price after regional resolution but before adjustments. */
  base_cents: Cents;
  /** What will actually be charged. */
  total_cents: Cents;
  coupon_code?: string;
  adjustments: QuoteAdjustment[];
}

export interface QuoteRequest {
  service: string;
  coupon_code?: string;
  addons?: string[];
}

/* ── Booking ───────────────────────────────────────────────────────────── */

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'refunded'
  | 'expired'
  | 'auto_refund_needed';

export interface BookingAddon {
  title: string;
  price_cents: Cents;
}

export interface Reading {
  type: ServiceType;
  content?: string;
  cards_drawn?: string;
  /** Signed link, valid ~6 hours. Fetch on demand rather than caching. */
  recording_url?: string;
  delivered_at: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  start_at: string;
  end_at: string;
  price_cents: Cents;
  service_id: string;
  service_name: string;
  /** Present only once the booking is `confirmed`. */
  meeting_link?: string;
  question?: string;
  addons?: BookingAddon[];
  created_at: string;
  /** Present only after the practitioner marks the reading delivered. */
  reading?: Reading;
}

export interface CreateBookingRequest {
  service: string;
  start_at: string;
  name: string;
  email: string;
  phone?: string;
  question?: string;
  answers?: Record<string, string>;
  coupon_code?: string;
  addons?: string[];
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CreatedBooking {
  booking_id: string;
  checkout_url: string;
  /** When the slot hold lapses if payment is not completed. */
  expires_at: string;
  total_cents: Cents;
  currency: CurrencyCode;
  /** Guests only, shown once. The only way a guest can see the booking later. */
  access_token?: string;
}

export interface CancelResult {
  status: BookingStatus;
  refund_pending: boolean;
}

/* ── Accounts ──────────────────────────────────────────────────────────── */

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
}

export interface Session {
  token: string;
  expires_at: string;
  customer: Customer;
}

export interface AcceptedResult {
  status: string;
  message: string;
}

export interface Message {
  sender: 'client' | 'reader';
  body: string;
  created_at: string;
}

export interface MeReading extends Reading {
  booking_id: string;
}

/* ── Envelope ──────────────────────────────────────────────────────────── */

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiErrorEnvelope {
  error: { code: string; message: string };
}

/**
 * Stable error codes. Branch on these, never on `message`.
 * `network_error` and `timeout` are synthesised client-side — the API itself
 * never returns them — so callers can treat "the server said no" and "we could
 * not reach the server" through one code path.
 */
export type ApiErrorCode =
  | 'bad_request'
  | 'invalid_token'
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'missing_token'
  | 'invalid_credentials'
  | 'no_tenant'
  | 'workspace_inactive'
  | 'insufficient_scope'
  | 'not_found'
  | 'slot_taken'
  | 'slot_unavailable'
  | 'cancel_window_passed'
  | 'change_window_passed'
  | 'invalid_coupon'
  | 'invalid_addon'
  | 'rate_limited'
  | 'locked_out'
  | 'payments_unavailable'
  | 'email_unavailable'
  | 'messaging_unavailable'
  | 'server_error'
  | 'network_error'
  | 'timeout'
  | 'not_configured'
  | (string & {});
