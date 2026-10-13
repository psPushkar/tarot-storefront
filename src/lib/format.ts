/**
 * Formatting helpers.
 *
 * Money and time are the two places a booking site most easily embarrasses
 * itself, so both are handled centrally and defensively here.
 */

/**
 * How many decimal places a currency uses. Zero-decimal currencies (JPY, KRW,
 * VND …) must not be divided by 100, so we ask Intl rather than assuming.
 */
function minorUnitDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/**
 * Render integer minor units as a currency string.
 * `formatMoney(11600, 'EUR')` → `€116.00`
 * `formatMoney(5000, 'JPY')`  → `¥5,000`
 */
export function formatMoney(cents: number, currency: string, locale = 'en-GB'): string {
  const digits = minorUnitDigits(currency);
  const amount = cents / 10 ** digits;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${amount.toFixed(digits)} ${currency}`;
  }
}

/** Split a formatted price so the symbol can be set smaller than the numeral. */
export function splitMoney(
  cents: number,
  currency: string,
  locale = 'en-GB',
): { symbol: string; amount: string } {
  const formatted = formatMoney(cents, currency, locale);
  const match = formatted.match(/^([^\d\s-]+)\s?(.+)$/);
  if (match && match[1] && match[2]) return { symbol: match[1], amount: match[2] };
  return { symbol: '', amount: formatted };
}

/** A signed delta, for quote adjustment rows. `-1900` → `−€19.00`. */
export function formatDelta(cents: number, currency: string, locale = 'en-GB'): string {
  if (cents === 0) return formatMoney(0, currency, locale);
  const sign = cents < 0 ? '\u2212' : '+';
  return `${sign}${formatMoney(Math.abs(cents), currency, locale)}`;
}

/* ── Time ──────────────────────────────────────────────────────────────── */

function safeDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `Monday, 31 August 2026` in the practitioner's timezone. */
export function formatDate(
  value: string | Date,
  timezone?: string,
  locale = 'en-GB',
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
): string {
  const date = safeDate(value);
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: timezone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** `31 Aug 2026` — for cards and lists. */
export function formatDateShort(value: string | Date, timezone?: string, locale = 'en-GB'): string {
  return formatDate(value, timezone, locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `3:00 pm` in the given timezone. */
export function formatTime(value: string | Date, timezone?: string, locale = 'en-GB'): string {
  const date = safeDate(value);
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    }).format(date);
  } catch {
    return '';
  }
}

/** `Monday, 31 August 2026 at 3:00 pm` */
export function formatDateTime(value: string | Date, timezone?: string, locale = 'en-GB'): string {
  const date = formatDate(value, timezone, locale);
  const time = formatTime(value, timezone, locale);
  return date && time ? `${date} at ${time}` : date || time;
}

/** The IANA zone the visitor's browser is in, or undefined during the build. */
export function visitorTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** `90 minutes` / `1 hour 30 minutes` — written out, never `1h30`. */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourPart = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return rest === 0 ? hourPart : `${hourPart} ${rest} minutes`;
}

/** `YYYY-MM-DD` for a Date, in UTC — the format every date query expects. */
export function toDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
}

/** Human relative time for message threads: `2 days ago`, `just now`. */
export function formatRelative(value: string | Date, locale = 'en-GB'): string {
  const date = safeDate(value);
  if (!date) return '';
  const diffMs = date.getTime() - Date.now();
  const absMinutes = Math.abs(diffMs) / 60_000;
  if (absMinutes < 1) return 'just now';

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.348],
    ['month', 12],
  ];

  let value_ = diffMs / 60_000;
  let unit: Intl.RelativeTimeFormatUnit = 'minute';
  for (const [nextUnit, divisor] of units) {
    unit = nextUnit;
    if (Math.abs(value_) < divisor) break;
    value_ /= divisor;
    unit = nextUnit === 'month' ? 'year' : unit;
  }

  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      Math.round(value_),
      unit,
    );
  } catch {
    return formatDateShort(date);
  }
}

/* ── Labels ────────────────────────────────────────────────────────────── */

const SERVICE_TYPE_LABELS: Record<string, string> = {
  live_video: 'Live video',
  phone: 'By telephone',
  recorded: 'Recorded',
  written: 'Written',
};

/** Human label for a service delivery format. */
export function serviceTypeLabel(type: string): string {
  return SERVICE_TYPE_LABELS[type] ?? 'Session';
}

const SERVICE_TYPE_NOTES: Record<string, string> = {
  live_video: 'A live conversation. A private link is sent once the booking is confirmed.',
  phone: 'A live conversation by telephone, at the number you give when booking.',
  recorded: 'No live call. A recording is sent to you once it is ready.',
  written: 'No live call. A written reading is delivered to your account.',
};

export function serviceTypeNote(type: string): string {
  return SERVICE_TYPE_NOTES[type] ?? '';
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'Not attended',
  refunded: 'Refunded',
  expired: 'Expired',
  auto_refund_needed: 'Refund in progress',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

/** Maps a booking status onto a badge variant class. */
export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'confirmed' || status === 'completed') return 'success';
  if (status === 'pending_payment' || status === 'auto_refund_needed') return 'warning';
  if (status === 'cancelled' || status === 'expired' || status === 'no_show') return 'danger';
  return 'default';
}

/** Rating rendered as a whole number of stars, clamped to the 1–5 range. */
export function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return 5;
  return Math.max(1, Math.min(5, Math.round(rating)));
}

/** First initial(s), for the avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return (parts[0] as string).slice(0, 2).toUpperCase();
  return `${(parts[0] as string)[0]}${(parts[parts.length - 1] as string)[0]}`.toUpperCase();
}

/** Trim prose to a length without cutting a word in half. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(' ', max)).trimEnd()}…`;
}
