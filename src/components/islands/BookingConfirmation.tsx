import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { getBooking } from '../../lib/api';
import type { ApiFailure } from '../../lib/result';
import { isTransient } from '../../lib/result';
import {
  clearLastBooking,
  credentialsForBooking,
  getLastBooking,
} from '../../lib/session';
import type { Booking } from '../../lib/types';
import {
  formatDateTime,
  formatMoney,
} from '../../lib/format';

/* ═══════════════════════════════════════════════════════════════════════
   Copy table
   ═══════════════════════════════════════════════════════════════════════ */

function describe(error: ApiFailure): { heading: string; body: string } {
  switch (error.code) {
    case 'not_found':
      return {
        heading: 'That booking could not be found.',
        body: 'The reference may be mistyped, or the link may have expired.',
      };
    default:
      return {
        heading: "Something didn\u2019t come through.",
        body: "This couldn\u2019t be completed at the moment. Please try again in a moment.",
      };
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   ICS helpers
   ═══════════════════════════════════════════════════════════════════════ */

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function buildIcs(booking: Booking): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TarotStorefront//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@storefront`,
    `DTSTART:${toIcsDate(booking.start_at)}`,
    `DTEND:${toIcsDate(booking.end_at)}`,
    `SUMMARY:${escapeIcs(booking.service_name)}`,
    `DESCRIPTION:${escapeIcs(`Your reading — ${booking.service_name}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function buildGoogleCalUrl(booking: Booking): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: booking.service_name,
    dates: `${toIcsDate(booking.start_at)}/${toIcsDate(booking.end_at)}`,
    details: `Your reading — ${booking.service_name}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookUrl(booking: Booking): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: booking.service_name,
    startdt: booking.start_at,
    enddt: booking.end_at,
    body: `Your reading — ${booking.service_name}`,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/* ═══════════════════════════════════════════════════════════════════════
   Ornament star (inline SVG, matches Ornament.astro star motif)
   ═══════════════════════════════════════════════════════════════════════ */

function OrnamentStar({ size = 80 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      class="confirm__star"
    >
      <path
        d="M12 0L13.4 9.2L20.5 3.5L14.8 10.6L24 12L14.8 13.4L20.5 20.5L13.4 14.8L12 24L10.6 14.8L3.5 20.5L9.2 13.4L0 12L9.2 10.6L3.5 3.5L10.6 9.2L12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function BookingConfirmation() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);
  // Held only to force a re-render on each poll; the count itself is tracked
  // in a local closure variable so the interval callback stays stable.
  const [, setPollCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [resolved, setResolved] = useState(false);

  const bookingIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Resolve booking id + credentials on mount ───────────────────── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get('booking') || params.get('id');
    const urlToken = params.get('token');

    if (!id) {
      const last = getLastBooking();
      if (last) {
        id = last.id;
      }
    }

    if (!id) {
      setLoading(false);
      return;
    }

    bookingIdRef.current = id;
    const creds = credentialsForBooking(id, urlToken);

    // Start polling
    let count = 0;
    const maxPolls = 20; // 20 * 3s = 60s

    const poll = async () => {
      const result = await getBooking(id as string, creds);
      count++;

      if (result.ok) {
        const b = result.data;
        setBooking(b);

        if (b.status === 'confirmed' || b.status === 'completed') {
          clearLastBooking();
          setResolved(true);
          setLoading(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
        if (b.status === 'cancelled' || b.status === 'expired') {
          setResolved(true);
          setLoading(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
      } else {
        setError(result.error);

        // A booking that cannot be found, or credentials that are not
        // accepted, will not start working on the next tick. Stop polling and
        // say so, rather than making the visitor wait out the full minute.
        if (!isTransient(result.error)) {
          setLoading(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
      }

      if (count >= maxPolls) {
        setTimedOut(true);
        setLoading(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }

      setPollCount(count);
    };

    // Initial poll
    void poll();
    timerRef.current = setInterval(() => void poll(), 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ── Download .ics ───────────────────────────────────────────────── */
  const downloadIcs = () => {
    if (!booking) return;
    const content = buildIcs(booking);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${booking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ── Reduced motion check ────────────────────────────────────────── */
  const prefersReducedMotion = useMemo(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  /* ── No booking at all ───────────────────────────────────────────── */
  if (!loading && !booking && !error) {
    return (
      <div class="confirm" aria-live="polite">
        <div class="confirm__inner">
          <OrnamentStar size={44} />
          <h1 class="confirm__heading">Looking for a booking?</h1>
          <p class="confirm__body">
            If you have just completed a payment, the confirmation details may not have arrived
            yet. Check your email for a confirmation, or visit your account.
          </p>
          <div class="confirm__actions">
            <a href="/account" class="btn btn-primary">Your account</a>
            <a href="/booking/manage" class="btn btn-ghost">Find a booking</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Polling / loading ───────────────────────────────────────────── */
  if (loading && !resolved) {
    return (
      <div class="confirm" aria-live="polite" aria-busy="true">
        <div class="confirm__inner">
          <div class="skeleton" style="height:60px;width:60px;border-radius:50%;margin:0 auto 24px" />
          <h1 class="confirm__heading">Confirming your payment…</h1>
          <p class="confirm__body">
            This usually takes just a moment. Please do not close this page.
          </p>
          <div class="skeleton" style="height:120px;border-radius:var(--radius-lg);margin-top:24px" />
        </div>
      </div>
    );
  }

  /* ── Could not read the booking ──────────────────────────────────── */
  if (error && !resolved && !loading && !booking) {
    const copy = describe(error);
    return (
      <div class="confirm" aria-live="polite">
        <div class="confirm__inner">
          <OrnamentStar size={44} />
          <h1 class="confirm__heading">{copy.heading}</h1>
          <p class="confirm__body">
            {copy.body} If you have just paid, your confirmation email is the source of truth and
            will arrive shortly.
          </p>
          {bookingIdRef.current && (
            <p class="confirm__ref">
              Your reference: <code style="color:var(--color-gold)">{bookingIdRef.current}</code>
            </p>
          )}
          <div class="confirm__actions">
            <a href="/account" class="btn btn-primary">Your account</a>
            <a href="/booking/manage" class="btn btn-ghost">Find a booking</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Timed out ───────────────────────────────────────────────────── */
  if (timedOut && !resolved) {
    return (
      <div class="confirm" aria-live="polite">
        <div class="confirm__inner">
          <OrnamentStar size={44} />
          <h1 class="confirm__heading">Still processing.</h1>
          <p class="confirm__body">
            The payment is taking longer than usual to confirm. This is not unusual — your
            confirmation email is the source of truth, and it will arrive as soon as everything
            is settled.
          </p>
          {bookingIdRef.current && (
            <p class="confirm__ref">
              Your reference: <code style="color:var(--color-gold)">{bookingIdRef.current}</code>
            </p>
          )}
          <div class="confirm__actions">
            <a href="/account" class="btn btn-primary">Your account</a>
            <a href="/booking/manage" class="btn btn-ghost">Check booking status</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Cancelled / expired ─────────────────────────────────────────── */
  if (booking && (booking.status === 'cancelled' || booking.status === 'expired')) {
    return (
      <div class="confirm" aria-live="polite">
        <div class="confirm__inner">
          <OrnamentStar size={44} />
          <h1 class="confirm__heading">This booking is no longer active.</h1>
          <p class="confirm__body">
            {booking.status === 'expired'
              ? 'The payment window closed before the transaction completed, and the time has been released. You are welcome to book again whenever suits you.'
              : 'This booking was cancelled. If you would like another reading, you are welcome to book again.'}
          </p>
          <div class="confirm__actions">
            <a href="/services" class="btn btn-primary">Book a reading</a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Confirmed ───────────────────────────────────────────────────── */
  if (!booking) return null;

  return (
    <div class="confirm" aria-live="polite">
      <div class="confirm__inner">
        <div class={`confirm__star-wrap ${prefersReducedMotion ? '' : 'confirm__star-wrap--animate'}`}>
          <OrnamentStar size={80} />
        </div>

        <h1 class="confirm__heading">Your reading is booked.</h1>

        <div class="panel confirm__summary">
          <dl class="breakdown">
            <div class="breakdown-row">
              <dt>Reading</dt>
              <dd>{booking.service_name}</dd>
            </div>
            <div class="breakdown-row">
              <dt>Date and time</dt>
              <dd>{formatDateTime(booking.start_at)}</dd>
            </div>
            <div class="breakdown-row">
              <dt>Price</dt>
              <dd>{formatMoney(booking.price_cents, 'GBP')}</dd>
            </div>
            <div class="breakdown-row">
              <dt>Reference</dt>
              <dd><code style="color:var(--color-gold)">{booking.id}</code></dd>
            </div>
          </dl>
        </div>

        <div class="confirm__next">
          <h2 class="confirm__next-heading">What happens next</h2>
          <ol class="confirm__steps">
            <li>A confirmation email is on its way with all the details.</li>
            <li>A private meeting link will be sent before the session — keep an eye on your inbox.</li>
            <li>You can view, move or cancel the booking from your account at any time before the session.</li>
          </ol>
        </div>

        <div class="confirm__calendar">
          <h3 class="confirm__cal-heading">Add to your calendar</h3>
          <div class="confirm__cal-links">
            <a href={buildGoogleCalUrl(booking)} target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">
              Google Calendar
            </a>
            <a href={buildOutlookUrl(booking)} target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">
              Outlook
            </a>
            <button type="button" class="btn btn-ghost btn-sm" onClick={downloadIcs}>
              Download .ics
            </button>
          </div>
        </div>

        <div class="confirm__actions">
          <a href="/account" class="btn btn-primary">Your account</a>
        </div>
      </div>
    </div>
  );
}
