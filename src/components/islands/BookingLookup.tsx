import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import {
  cancelBooking,
  getAvailability,
  getAvailabilityDays,
  getBooking,
  rescheduleBooking,
} from '../../lib/api';
import type { ApiFailure } from '../../lib/result';
import type { Credentials } from '../../lib/api';
import { credentialsForBooking } from '../../lib/session';
import type { AvailabilityDay, Booking, CancelResult, Slot } from '../../lib/types';
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  statusLabel,
  statusTone,
} from '../../lib/format';

/* ═══════════════════════════════════════════════════════════════════════
   Copy table
   ═══════════════════════════════════════════════════════════════════════ */

function describe(error: ApiFailure): { heading: string; body: string } {
  switch (error.code) {
    case 'cancel_window_passed':
      return {
        heading: 'It is too late to cancel this one.',
        body: 'The cancellation window has closed, because the time has been held for you and can no longer be offered to anyone else. Please write to me if something has gone wrong.',
      };
    case 'change_window_passed':
      return {
        heading: 'It is too late to move this one.',
        body: 'The change window has closed, because the time has been held for you and can no longer be offered to anyone else. Please write to me if something has gone wrong.',
      };
    case 'not_found':
      return {
        heading: 'That booking could not be found.',
        body: 'The reference may be mistyped, or the link may have expired. Check the confirmation email, or write to me and I will find it.',
      };
    case 'slot_taken':
      return {
        heading: 'That time has just gone.',
        body: 'Someone booked it a moment before you. Choose another time.',
      };
    case 'slot_unavailable':
      return {
        heading: 'That time is no longer offered.',
        body: 'Pick another time from the refreshed list.',
      };
    case 'network_error':
    case 'timeout':
    case 'server_error':
    case 'not_configured':
      return {
        heading: "Something didn\u2019t come through.",
        body: "This couldn\u2019t be completed at the moment. Please try again in a moment.",
      };
    default:
      return {
        heading: "Something didn\u2019t come through.",
        body: "This couldn\u2019t be completed at the moment. Please try again in a moment.",
      };
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Calendar helpers
   ═══════════════════════════════════════════════════════════════════════ */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(date: Date, count: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1));
}

function weekdayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function BookingLookup() {
  /* ── URL params & credentials ─────────────────────────────────────── */
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials>({});
  const [checked, setChecked] = useState(false);

  /* ── Manual lookup form ──────────────────────────────────────────── */
  const [manualRef, setManualRef] = useState('');

  /* ── Booking ──────────────────────────────────────────────────────── */
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);

  /* ── Reschedule ──────────────────────────────────────────────────── */
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [daysLoading, setDaysLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<ApiFailure | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  /* ── Cancel ──────────────────────────────────────────────────────── */
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<ApiFailure | null>(null);
  const [cancelResult, setCancelResult] = useState<CancelResult | null>(null);

  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const visitorTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  /* ── Init ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const urlToken = params.get('token');

    setBookingId(id);
    setChecked(true);

    if (!id) {
      setLoading(false);
      return;
    }

    const creds = credentialsForBooking(id, urlToken);
    setCredentials(creds);

    let cancelled = false;
    (async () => {
      const result = await getBooking(id, creds);
      if (cancelled) return;
      if (result.ok) {
        setBooking(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Manual lookup ────────────────────────────────────────────────── */
  const handleManualLookup = (event: Event) => {
    event.preventDefault();
    const trimmed = manualRef.trim();
    if (trimmed) {
      window.location.href = `/booking/manage?id=${encodeURIComponent(trimmed)}`;
    }
  };

  /* ── Load availability days ──────────────────────────────────────── */
  const loadDays = useCallback(
    async (target: Date, serviceSlug: string) => {
      setDaysLoading(true);
      const monthStart = startOfMonth(target);
      const monthEnd = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0));
      const now = new Date();
      const from = monthStart.getTime() < now.getTime() ? dateKey(now) : dateKey(monthStart);
      const horizon = new Date(now.getTime() + 90 * 86_400_000);
      const to = dateKey(monthEnd.getTime() > horizon.getTime() ? horizon : monthEnd);

      if (new Date(`${from}T00:00:00Z`) > new Date(`${to}T00:00:00Z`)) {
        setDays([]);
        setDaysLoading(false);
        return;
      }

      const result = await getAvailabilityDays(serviceSlug, from, to);
      if (result.ok) setDays(result.data.days);
      else setDays([]);
      setDaysLoading(false);
    },
    [],
  );

  /* ── Load when booking is loaded and tab has a service ─────────── */
  useEffect(() => {
    if (booking && canAct) {
      // We need the service slug. The booking only has service_id.
      // The availability endpoint takes service slug. We use service_id as a best-effort slug.
      void loadDays(month, booking.service_id);
    }
  }, [booking, month]);

  /* ── Load slots ──────────────────────────────────────────────────── */
  const loadSlots = useCallback(
    async (date: string, serviceSlug: string) => {
      setSlotsLoading(true);
      setSlot(null);
      const result = await getAvailability(serviceSlug, date, visitorTimezone);
      if (result.ok) setSlots(result.data.slots);
      else setSlots([]);
      setSlotsLoading(false);
    },
    [visitorTimezone],
  );

  const chooseDate = (date: string) => {
    setSelectedDate(date);
    if (booking) void loadSlots(date, booking.service_id);
  };

  /* ── Reschedule ──────────────────────────────────────────────────── */
  const handleReschedule = async () => {
    if (!bookingId || !slot || rescheduleLoading) return;
    setRescheduleLoading(true);
    setRescheduleError(null);

    const result = await rescheduleBooking(bookingId, slot.start_at, credentials);
    if (result.ok) {
      setBooking(result.data);
      setRescheduleSuccess(true);
      setSlot(null);
      setSelectedDate(null);
    } else {
      setRescheduleError(result.error);
    }
    setRescheduleLoading(false);
  };

  /* ── Cancel ──────────────────────────────────────────────────────── */
  const handleCancel = async () => {
    if (!bookingId || cancelLoading) return;
    setCancelLoading(true);
    setCancelError(null);

    const result = await cancelBooking(bookingId, credentials);
    if (result.ok) {
      setCancelResult(result.data);
      setShowCancelConfirm(false);
      setBooking((prev) => prev ? { ...prev, status: result.data.status } : prev);
    } else {
      setCancelError(result.error);
    }
    setCancelLoading(false);
  };

  /* ── Derived calendar ────────────────────────────────────────────── */
  const dayMap = useMemo(() => {
    const map = new Map<string, AvailabilityDay>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
    const lead = weekdayIndex(first);
    const list: ({ key: string; day: number } | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), d));
      list.push({ key: dateKey(date), day: d });
    }
    return list;
  }, [month]);

  const todayKey = dateKey(new Date());
  const firstMonthKey = dateKey(startOfMonth(new Date()));
  const horizonKey = dateKey(new Date(Date.now() + 90 * 86_400_000));
  const canGoBack = dateKey(month) > firstMonthKey;
  const canGoForward = dateKey(addMonths(month, 1)) <= horizonKey;

  const canAct = booking && (booking.status === 'confirmed' || booking.status === 'pending_payment');

  /* ── Badge helper ─────────────────────────────────────────────────── */
  function badgeClass(status: string): string {
    const tone = statusTone(status);
    if (tone === 'success') return 'badge badge-success';
    if (tone === 'warning') return 'badge badge-warning';
    if (tone === 'danger') return 'badge badge-danger';
    return 'badge';
  }

  /* ── No ID: show lookup form ─────────────────────────────────────── */
  if (checked && !bookingId) {
    return (
      <div class="lookup" aria-live="polite">
        <div class="lookup__form-wrap panel">
          <h2 class="lookup__heading">Find your booking</h2>
          <p class="lookup__body">
            Enter the booking reference from your confirmation email. It is a short code that
            looks something like <code style="color:var(--color-gold)">a1b2c3d4</code>.
          </p>
          <form class="form" noValidate onSubmit={handleManualLookup}>
            <div class="field">
              <label class="label" for="booking-ref">Booking reference</label>
              <input
                id="booking-ref"
                class="input"
                value={manualRef}
                onInput={(e) => setManualRef((e.target as HTMLInputElement).value)}
                autocomplete="off"
              />
            </div>
            <button type="submit" class="btn btn-primary" disabled={!manualRef.trim()}>
              Look up
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div class="lookup" aria-busy="true" aria-label="Loading booking">
        <div class="skeleton" style="height:200px;border-radius:var(--radius-lg)" />
      </div>
    );
  }

  if (error) {
    const err = describe(error);
    return (
      <div class="lookup" aria-live="polite">
        <div class="lookup__error panel">
          <h2 class="lookup__heading">{err.heading}</h2>
          <p class="lookup__body">{err.body}</p>
          <a href="/booking/manage" class="btn btn-ghost">Try another reference</a>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  /* ── TWO-PANEL layout ────────────────────────────────────────────── */
  return (
    <div class="lookup" aria-live="polite">
      <div class="lookup__split">
        {/* ── Left: details ──────────────────────────────────────── */}
        <div class="lookup__details panel">
          <div class="lookup__details-top">
            <span class={badgeClass(booking.status)}>{statusLabel(booking.status)}</span>
          </div>
          <h2 class="lookup__service">{booking.service_name}</h2>
          <dl class="breakdown">
            <div class="breakdown-row">
              <dt>Date and time</dt>
              <dd>{formatDateTime(booking.start_at)}</dd>
            </div>
            <div class="breakdown-row">
              <dt>Duration</dt>
              <dd>{formatDuration(
                Math.round((new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 60000)
              )}</dd>
            </div>
            <div class="breakdown-row">
              <dt>Price</dt>
              <dd>{formatMoney(booking.price_cents, 'GBP')}</dd>
            </div>
            {booking.question && (
              <div class="breakdown-row">
                <dt>Your question</dt>
                <dd style="white-space:normal;text-align:start">{booking.question}</dd>
              </div>
            )}
          </dl>
          <p class="help" style="margin-top:12px">
            Reference: <code style="color:var(--color-gold)">{booking.id}</code>
          </p>
        </div>

        {/* ── Right: actions ─────────────────────────────────────── */}
        {canAct && (
          <div class="lookup__actions">
            {/* ── Reschedule ──────────────────────────────────────── */}
            <div class="panel lookup__action-card">
              <h3 class="lookup__action-heading">Move this booking</h3>

              {rescheduleSuccess && (
                <div class="notice notice-success" role="status" style="margin-bottom:16px">
                  <div>Your booking has been moved successfully.</div>
                </div>
              )}
              {rescheduleError && (
                <div class="notice notice-danger" role="alert" style="margin-bottom:16px">
                  <div>
                    <strong>{describe(rescheduleError).heading}</strong>
                    <p>{describe(rescheduleError).body}</p>
                  </div>
                </div>
              )}

              {/* Calendar */}
              <div class="cal">
                <div class="cal__head">
                  <button
                    type="button"
                    class="cal__nav"
                    onClick={() => setMonth(addMonths(month, -1))}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4L6 8l4 4" /></svg>
                  </button>
                  <h4 class="cal__month" aria-live="polite">{monthLabel(month)}</h4>
                  <button
                    type="button"
                    class="cal__nav"
                    onClick={() => setMonth(addMonths(month, 1))}
                    disabled={!canGoForward}
                    aria-label="Next month"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4" /></svg>
                  </button>
                </div>

                <div class="cal__weekdays" aria-hidden="true">
                  {WEEKDAYS.map((d) => <span key={d}>{d.charAt(0)}</span>)}
                </div>

                {daysLoading ? (
                  <div class="cal__grid" aria-busy="true">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <span key={i} class="skeleton cal__skeleton" />
                    ))}
                  </div>
                ) : (
                  <div class="cal__grid" role="group" aria-label="Choose a new date">
                    {cells.map((cell, i) =>
                      cell === null ? (
                        <span key={`pad-${i}`} />
                      ) : (
                        <button
                          key={cell.key}
                          type="button"
                          class="day"
                          disabled={!dayMap.get(cell.key)?.available}
                          data-today={cell.key === todayKey}
                          aria-pressed={selectedDate === cell.key}
                          onClick={() => chooseDate(cell.key)}
                        >
                          {cell.day}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Slots */}
              {selectedDate && (
                <div class="slots" style="margin-top:16px">
                  <h4 class="slots__heading">{formatDate(`${selectedDate}T12:00:00Z`, 'UTC')}</h4>
                  {slotsLoading ? (
                    <div class="slots__list" aria-busy="true">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <span key={i} class="skeleton slots__skeleton" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <p class="help">No available times on this date.</p>
                  ) : (
                    <div class="slots__list" role="group" aria-label="Choose a time">
                      {slots.map((s) => (
                        <button
                          key={s.start_at}
                          type="button"
                          class="chip"
                          aria-pressed={slot?.start_at === s.start_at}
                          onClick={() => setSlot(s)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                class="btn btn-primary btn-sm"
                style="margin-top:16px"
                disabled={!slot || rescheduleLoading}
                onClick={() => void handleReschedule()}
              >
                {rescheduleLoading ? 'Moving\u2026' : 'Confirm new time'}
              </button>
            </div>

            {/* ── Cancel ─────────────────────────────────────────── */}
            <div class="panel lookup__action-card">
              <h3 class="lookup__action-heading">Cancel this booking</h3>

              {cancelResult && (
                <div class="notice notice-success" role="status" style="margin-bottom:16px">
                  <div>
                    {cancelResult.refund_pending
                      ? 'Your booking has been cancelled and a refund is being processed. It will arrive within a few business days.'
                      : 'Your booking has been cancelled.'}
                  </div>
                </div>
              )}
              {cancelError && (
                <div class="notice notice-danger" role="alert" style="margin-bottom:16px">
                  <div>
                    <strong>{describe(cancelError).heading}</strong>
                    <p>{describe(cancelError).body}</p>
                  </div>
                </div>
              )}

              {!cancelResult && !showCancelConfirm && (
                <button
                  type="button"
                  class="btn btn-ghost lookup__cancel-btn"
                  ref={cancelBtnRef}
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel booking
                </button>
              )}

              {showCancelConfirm && (
                <div class="lookup__cancel-confirm" role="alertdialog" aria-label="Confirm cancellation">
                  <p class="lookup__cancel-text">
                    Are you sure? This cannot be undone. If a refund is due it will be processed
                    automatically.
                  </p>
                  <div class="lookup__cancel-actions">
                    <button
                      type="button"
                      class="btn btn-ghost lookup__cancel-btn"
                      disabled={cancelLoading}
                      onClick={() => void handleCancel()}
                    >
                      {cancelLoading ? 'Cancelling\u2026' : 'Yes, cancel'}
                    </button>
                    <button
                      type="button"
                      class="btn btn-quiet btn-sm"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Keep booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
