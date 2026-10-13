import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { createBooking, getAvailability, getAvailabilityDays, postQuote } from '../../lib/api';
import type { ApiFailure } from '../../lib/result';
import { formatDate, formatDelta, formatDuration, formatMoney, splitMoney } from '../../lib/format';
import { getCustomerToken, saveLastBooking } from '../../lib/session';
import type { AvailabilityDay, Quote, ServiceDetail, Slot } from '../../lib/types';

/* ═══════════════════════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════════════════════ */

interface Props {
  service: ServiceDetail;
  /** The practitioner's IANA zone, for the "their time" reference line. */
  practitionerTimezone: string;
  minNoticeHours: number;
  maxHorizonDays: number;
  siteUrl: string;
  /** True when the practitioner is away; the flow refuses to start. */
  onVacation: boolean;
  vacationMessage?: string;
}

type StepId = 1 | 2 | 3;

const STEPS: { id: StepId; label: string }[] = [
  { id: 1, label: 'Time' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Payment' },
];

/* ═══════════════════════════════════════════════════════════════════════
   Copy for every failure the API can hand back.

   Kept in one table so no code path can invent its own wording, and so the
   raw `error.message` from the server is never shown to a visitor.
   ═══════════════════════════════════════════════════════════════════════ */

function describe(error: ApiFailure): { heading: string; body: string } {
  switch (error.code) {
    case 'slot_taken':
      return {
        heading: 'That time has just gone.',
        body: 'Someone booked it a moment before you did. Choose another time and nothing else you have entered will be lost.',
      };
    case 'slot_unavailable':
      return {
        heading: 'That time is no longer offered.',
        body: 'The schedule changed while this page was open. Pick another time from the refreshed list.',
      };
    case 'invalid_coupon':
      return {
        heading: 'That code did not work.',
        body: 'It may have expired, been fully used, or not apply to this reading. You can continue without it.',
      };
    case 'invalid_addon':
      return {
        heading: 'One of the extras is no longer available.',
        body: 'The catalogue has changed since this page loaded. Please reload and choose again.',
      };
    case 'payments_unavailable':
      return {
        heading: 'Booking is not currently available.',
        body: 'The payment system is being set up. You can still explore the readings offered, and write to me directly to arrange a session.',
      };
    case 'rate_limited':
      return {
        heading: 'Please slow down.',
        body: error.retryAfter
          ? `To protect everyone's experience, wait about ${error.retryAfter} seconds before trying again.`
          : "To protect everyone's experience, wait a few minutes before trying again.",
      };
    case 'workspace_inactive':
    case 'not_configured':
      return {
        heading: 'Booking is not currently available.',
        body: 'This site is not connected to its booking service at the moment. Please write to me directly and we will arrange a time.',
      };
    case 'bad_request':
      return {
        heading: 'Something in the form needs attention.',
        body: 'Please check the details you entered and try once more.',
      };
    case 'not_found':
      return {
        heading: 'This reading could not be found.',
        body: 'It may have been withdrawn. Please choose another from the list of readings.',
      };
    default:
      return {
        heading: "Something didn't come through.",
        body: 'The booking could not be completed at the moment. This is most likely a brief interruption — please try again in a moment.',
      };
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Calendar helpers — all in UTC, because `start_at` is UTC and mixing the
   two is how booking systems quietly book the wrong day.
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

/** Monday-first weekday index, 0–6. */
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

export default function BookingFlow({
  service,
  practitionerTimezone,
  minNoticeHours,
  maxHorizonDays,
  siteUrl,
  onVacation,
  vacationMessage,
}: Props) {
  const [step, setStep] = useState<StepId>(1);

  /* ── Schedule ──────────────────────────────────────────────────────── */
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [daysLoading, setDaysLoading] = useState(true);
  const [daysError, setDaysError] = useState<ApiFailure | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<ApiFailure | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);

  /* ── Details ───────────────────────────────────────────────────────── */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* ── Pricing ───────────────────────────────────────────────────────── */
  const [addons, setAddons] = useState<string[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<ApiFailure | null>(null);

  /* ── Submission ────────────────────────────────────────────────────── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiFailure | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const visitorTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const showsDifferentZone = visitorTimezone !== practitionerTimezone;

  /* ── Load the month's open-day counts ──────────────────────────────── */

  const loadDays = useCallback(
    async (target: Date) => {
      setDaysLoading(true);
      setDaysError(null);

      const now = new Date();
      const monthStart = startOfMonth(target);
      const monthEnd = new Date(
        Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
      );

      // Never ask for dates before today, and never beyond the practitioner's
      // horizon — the endpoint caps at 62 days regardless.
      const from = monthStart.getTime() < now.getTime() ? dateKey(now) : dateKey(monthStart);
      const horizon = new Date(now.getTime() + maxHorizonDays * 86_400_000);
      const to = dateKey(monthEnd.getTime() > horizon.getTime() ? horizon : monthEnd);

      if (new Date(`${from}T00:00:00Z`) > new Date(`${to}T00:00:00Z`)) {
        setDays([]);
        setDaysLoading(false);
        return;
      }

      const result = await getAvailabilityDays(service.slug, from, to);
      if (result.ok) setDays(result.data.days);
      else {
        setDays([]);
        setDaysError(result.error);
      }
      setDaysLoading(false);
    },
    [service.slug, maxHorizonDays],
  );

  useEffect(() => {
    if (!onVacation) void loadDays(month);
  }, [month, loadDays, onVacation]);

  /* ── Load one day's slots ──────────────────────────────────────────── */

  const loadSlots = useCallback(
    async (date: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      setSlot(null);

      const result = await getAvailability(service.slug, date, visitorTimezone);
      if (result.ok) setSlots(result.data.slots);
      else {
        setSlots([]);
        setSlotsError(result.error);
      }
      setSlotsLoading(false);
    },
    [service.slug, visitorTimezone],
  );

  const chooseDate = (date: string) => {
    setSelectedDate(date);
    void loadSlots(date);
  };

  /* ── Quote, recalculated whenever the basket changes ───────────────── */

  const loadQuote = useCallback(
    async (coupon: string, selectedAddons: string[]) => {
      setQuoteLoading(true);
      setQuoteError(null);

      const result = await postQuote({
        service: service.slug,
        coupon_code: coupon || undefined,
        addons: selectedAddons.length > 0 ? selectedAddons : undefined,
      });

      if (result.ok) {
        setQuote(result.data);
        setAppliedCoupon(coupon);
      } else {
        setQuoteError(result.error);
        // A rejected coupon must not silently persist into checkout.
        if (result.error.code === 'invalid_coupon') setAppliedCoupon('');
      }
      setQuoteLoading(false);
    },
    [service.slug],
  );

  useEffect(() => {
    if (step === 3) void loadQuote(appliedCoupon, addons);
    // `appliedCoupon` is intentionally omitted: applying a coupon calls
    // loadQuote directly, and re-running here would double-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, addons, loadQuote]);

  /* ── Validation ────────────────────────────────────────────────────── */

  const validateDetails = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'This field is required to continue.';
    if (!email.trim()) errors.email = 'This field is required to continue.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      errors.email = 'Please enter a valid email address.';

    if (service.intake_type === 'tarot' && !question.trim())
      errors.question = 'This field is required to continue.';

    if (service.intake_type === 'astrology') {
      if (!birthDate) errors.birth_date = 'This field is required to continue.';
      if (!birthPlace.trim()) errors.birth_place = 'This field is required to continue.';
    }

    if (service.intake_type === 'numerology' && !birthDate)
      errors.birth_date = 'This field is required to continue.';

    for (const item of service.questions ?? []) {
      if (item.required && !(answers[item.id] ?? '').trim())
        errors[item.id] = 'This field is required to continue.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      window.setTimeout(() => errorRef.current?.focus(), 0);
      return false;
    }
    return true;
  };

  const goTo = (next: StepId) => {
    setStep(next);
    setSubmitError(null);
    window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      panelRef.current?.focus();
    }, 0);
  };

  /* ── Submit ────────────────────────────────────────────────────────── */

  const submit = async () => {
    if (!slot || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const customerToken = getCustomerToken();

    const result = await createBooking(
      {
        service: service.slug,
        start_at: slot.start_at,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        question: question.trim() || undefined,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
        coupon_code: appliedCoupon || undefined,
        addons: addons.length > 0 ? addons : undefined,
        birth_date: birthDate || undefined,
        birth_time: birthTime || undefined,
        birth_place: birthPlace.trim() || undefined,
        success_url: `${siteUrl}/booking/confirmation`,
        cancel_url: `${siteUrl}/book/${service.slug}`,
      },
      customerToken ? { customerToken } : {},
    );

    if (!result.ok) {
      setSubmitError(result.error);
      setSubmitting(false);

      // A lost slot has to send the visitor back to a refreshed schedule,
      // otherwise they simply fail again on the same time.
      if (result.error.code === 'slot_taken' || result.error.code === 'slot_unavailable') {
        setSlot(null);
        if (selectedDate) void loadSlots(selectedDate);
        void loadDays(month);
        goTo(1);
      }
      return;
    }

    // Written before the redirect: the payment provider returns the visitor to
    // a fixed URL that cannot carry an id which did not exist when it was sent.
    saveLastBooking({
      id: result.data.booking_id,
      token: result.data.access_token,
      serviceSlug: service.slug,
      startAt: slot.start_at,
    });

    window.location.href = result.data.checkout_url;
  };

  /* ── Derived calendar grid ─────────────────────────────────────────── */

  const dayMap = useMemo(() => {
    const map = new Map<string, AvailabilityDay>();
    for (const day of days) map.set(day.date, day);
    return map;
  }, [days]);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const daysInMonth = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const lead = weekdayIndex(first);

    const list: ({ key: string; day: number } | null)[] = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day));
      list.push({ key: dateKey(date), day });
    }
    return list;
  }, [month]);

  const todayKey = dateKey(new Date());
  const horizonKey = dateKey(new Date(Date.now() + maxHorizonDays * 86_400_000));
  const firstMonthKey = dateKey(startOfMonth(new Date()));
  const canGoBack = dateKey(month) > firstMonthKey;
  const canGoForward = dateKey(addMonths(month, 1)) <= horizonKey;

  const currency = quote?.currency ?? service.currency;
  const totalCents = quote?.total_cents ?? service.price_cents;
  const { symbol, amount } = splitMoney(totalCents, currency);

  /* ── Vacation short-circuit ────────────────────────────────────────── */

  if (onVacation) {
    return (
      <div class="flow-state">
        <h2>Away for a time.</h2>
        <p>
          {vacationMessage ||
            'I am taking a short pause from readings. Existing bookings are unaffected.'}
        </p>
        <div class="flow-state__actions">
          <a href="/contact" class="btn btn-primary">Write to me</a>
          <a href="/journal" class="btn btn-ghost">Read the journal</a>
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════ */

  return (
    <div class="flow">
      {/* ── Stepper ──────────────────────────────────────────────────── */}
      <ol class="stepper" aria-label="Booking progress">
        {STEPS.map((entry, index) => {
          const state = step > entry.id ? 'complete' : step === entry.id ? 'current' : 'upcoming';
          return (
            <li key={entry.id} class="stepper__item" data-state={state}>
              {index > 0 && <span class="stepper__line" aria-hidden="true" />}
              <span class="stepper__circle" aria-hidden="true">
                {state === 'complete' ? (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.5 8.5L6 12L13.5 4" />
                  </svg>
                ) : (
                  entry.id
                )}
              </span>
              <span class="stepper__label">
                <span class="stepper__sr">
                  {state === 'complete' ? 'Completed: ' : state === 'current' ? 'Current step: ' : ''}
                </span>
                {entry.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div class="flow__body">
        <div class="flow__main" ref={panelRef} tabIndex={-1} aria-live="polite">
          {/* ── Step 1 — Time ──────────────────────────────────────── */}
          {step === 1 && (
            <section aria-labelledby="step-time">
              <h2 id="step-time" class="flow__heading">When would suit you?</h2>
              <p class="flow__sub">
                Times are shown in your own timezone
                {showsDifferentZone ? ` (${visitorTimezone})` : ''}. Bookings open{' '}
                {minNoticeHours} hours ahead.
              </p>

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
                  <h3 class="cal__month" aria-live="polite">{monthLabel(month)}</h3>
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
                  {WEEKDAYS.map((day) => (
                    <span key={day}>{day.charAt(0)}</span>
                  ))}
                </div>

                {daysLoading ? (
                  <div class="cal__grid" aria-busy="true" aria-label="Loading availability">
                    {Array.from({ length: 35 }).map((_, index) => (
                      <span key={index} class="skeleton cal__skeleton" />
                    ))}
                  </div>
                ) : daysError ? (
                  <p class="flow__inline-error">
                    The calendar couldn't be loaded just now. Please refresh the page to try again.
                  </p>
                ) : (
                  <div class="cal__grid" role="group" aria-label="Choose a date">
                    {cells.map((cell, index) =>
                      cell === null ? (
                        <span key={`pad-${index}`} />
                      ) : (
                        <button
                          key={cell.key}
                          type="button"
                          class="day"
                          disabled={!dayMap.get(cell.key)?.available}
                          data-today={cell.key === todayKey}
                          aria-pressed={selectedDate === cell.key}
                          aria-label={`${formatDate(`${cell.key}T12:00:00Z`, 'UTC')}${
                            dayMap.get(cell.key)?.available
                              ? `, ${dayMap.get(cell.key)?.slot_count} times available`
                              : ', no times available'
                          }`}
                          onClick={() => chooseDate(cell.key)}
                        >
                          {cell.day}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* ── Slots ────────────────────────────────────────────── */}
              {selectedDate && (
                <div class="slots">
                  <h3 class="slots__heading">
                    {formatDate(`${selectedDate}T12:00:00Z`, 'UTC')}
                  </h3>

                  {slotsLoading ? (
                    <div class="slots__list" aria-busy="true">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <span key={index} class="skeleton slots__skeleton" />
                      ))}
                    </div>
                  ) : slotsError ? (
                    <p class="flow__inline-error">
                      The times for this date couldn't be loaded. Please choose another date, or
                      refresh the page.
                    </p>
                  ) : slots.length === 0 ? (
                    <p class="slots__empty">
                      There are no available times on this date. Please select another day —
                      earlier availability often opens midweek.
                    </p>
                  ) : (
                    <div class="slots__list" role="group" aria-label="Choose a time">
                      {slots.map((entry) => (
                        <button
                          key={entry.start_at}
                          type="button"
                          class="chip"
                          aria-pressed={slot?.start_at === entry.start_at}
                          onClick={() => setSlot(entry)}
                        >
                          {entry.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div class="flow__actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  disabled={!slot}
                  onClick={() => goTo(2)}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {/* ── Step 2 — Details ───────────────────────────────────── */}
          {step === 2 && (
            <section aria-labelledby="step-details">
              <h2 id="step-details" class="flow__heading">A little about you</h2>
              <p class="flow__sub">
                Everything here is kept in confidence and is never shared with anyone.
              </p>

              {Object.keys(fieldErrors).length > 0 && (
                <div
                  class="notice notice-danger flow__summary"
                  role="alert"
                  tabIndex={-1}
                  ref={errorRef}
                >
                  <div>
                    <strong>A few things need attention.</strong>
                    <p>Please complete the fields marked below to continue.</p>
                  </div>
                </div>
              )}

              <form
                class="form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (validateDetails()) goTo(3);
                }}
              >
                <Field
                  id="name"
                  label="Your name"
                  value={name}
                  onInput={setName}
                  error={fieldErrors.name}
                  autocomplete="name"
                />
                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onInput={setEmail}
                  error={fieldErrors.email}
                  help="Your confirmation and the reading itself are sent here."
                  autocomplete="email"
                />
                <Field
                  id="phone"
                  label="Telephone"
                  type="tel"
                  value={phone}
                  onInput={setPhone}
                  optional
                  autocomplete="tel"
                  help={
                    service.type === 'phone'
                      ? 'Required for a telephone reading — include the country code.'
                      : undefined
                  }
                />

                {service.intake_type === 'tarot' && (
                  <Field
                    id="question"
                    label="Your question"
                    textarea
                    value={question}
                    onInput={setQuestion}
                    error={fieldErrors.question}
                    help="A few honest sentences are better than a paragraph."
                  />
                )}

                {(service.intake_type === 'astrology' || service.intake_type === 'numerology') && (
                  <>
                    <Field
                      id="birth_date"
                      label="Date of birth"
                      type="date"
                      value={birthDate}
                      onInput={setBirthDate}
                      error={fieldErrors.birth_date}
                    />
                    {service.intake_type === 'astrology' && (
                      <>
                        <Field
                          id="birth_time"
                          label="Time of birth"
                          type="time"
                          value={birthTime}
                          onInput={setBirthTime}
                          optional
                          help="If you do not know it, leave this blank — there is still a great deal to read without it."
                        />
                        <Field
                          id="birth_place"
                          label="Place of birth"
                          value={birthPlace}
                          onInput={setBirthPlace}
                          error={fieldErrors.birth_place}
                          help="Town and country is enough."
                        />
                      </>
                    )}
                  </>
                )}

                {(service.questions ?? []).map((item) => (
                  <Field
                    key={item.id}
                    id={item.id}
                    label={item.question}
                    textarea
                    value={answers[item.id] ?? ''}
                    onInput={(value) => setAnswers({ ...answers, [item.id]: value })}
                    error={fieldErrors[item.id]}
                    optional={!item.required}
                  />
                ))}

                {service.intake_type !== 'tarot' && (
                  <Field
                    id="question"
                    label="Anything else I should know"
                    textarea
                    value={question}
                    onInput={setQuestion}
                    optional
                  />
                )}

                <div class="flow__actions">
                  <button type="button" class="btn btn-quiet" onClick={() => goTo(1)}>
                    Back
                  </button>
                  <button type="submit" class="btn btn-primary">Continue</button>
                </div>
              </form>
            </section>
          )}

          {/* ── Step 3 — Payment ───────────────────────────────────── */}
          {step === 3 && (
            <section aria-labelledby="step-payment">
              <h2 id="step-payment" class="flow__heading">Confirm and pay</h2>
              <p class="flow__sub">
                Payment is handled entirely by Stripe. Card details never touch this website.
              </p>

              {(service.addons ?? []).length > 0 && (
                <fieldset class="extras">
                  <legend class="eyebrow">Optional extras</legend>
                  {(service.addons ?? []).map((addon) => (
                    <label key={addon.id} class="extras__row">
                      <input
                        type="checkbox"
                        checked={addons.includes(addon.id)}
                        onChange={(event) => {
                          const checked = (event.target as HTMLInputElement).checked;
                          setAddons(
                            checked
                              ? [...addons, addon.id]
                              : addons.filter((id) => id !== addon.id),
                          );
                        }}
                      />
                      <span class="extras__title">{addon.title}</span>
                      <span class="extras__price">
                        {formatMoney(addon.price_cents, service.currency)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}

              <div class="coupon">
                <label class="label" for="coupon">Discount code</label>
                <div class="coupon__row">
                  <input
                    id="coupon"
                    class="input"
                    value={couponInput}
                    placeholder="If you have one"
                    onInput={(event) => setCouponInput((event.target as HTMLInputElement).value)}
                  />
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    disabled={quoteLoading || !couponInput.trim()}
                    onClick={() => void loadQuote(couponInput.trim(), addons)}
                  >
                    Apply
                  </button>
                </div>
                {quoteError?.code === 'invalid_coupon' && (
                  <p class="error-text">{describe(quoteError).body}</p>
                )}
                {appliedCoupon && !quoteError && (
                  <p class="help">Code {appliedCoupon} applied.</p>
                )}
              </div>

              <dl class="breakdown">
                {quoteLoading ? (
                  <>
                    <span class="skeleton breakdown__skeleton" />
                    <span class="skeleton breakdown__skeleton" />
                  </>
                ) : quote ? (
                  <>
                    <div class="breakdown-row">
                      <dt>{service.title}</dt>
                      <dd>{formatMoney(quote.base_cents, quote.currency)}</dd>
                    </div>
                    {quote.adjustments
                      .filter((adjustment) => adjustment.delta_cents !== 0)
                      .map((adjustment) => (
                        <div
                          key={`${adjustment.type}-${adjustment.label}`}
                          class="breakdown-row"
                          data-discount={adjustment.delta_cents < 0}
                        >
                          <dt>{adjustment.label}</dt>
                          <dd>{formatDelta(adjustment.delta_cents, quote.currency)}</dd>
                        </div>
                      ))}
                    <div class="breakdown-total">
                      <dt>Total</dt>
                      <dd class="price">
                        <span class="price-currency">{symbol}</span>
                        {amount}
                      </dd>
                    </div>
                  </>
                ) : (
                  <div class="breakdown-total">
                    <dt>Total</dt>
                    <dd class="price">
                      <span class="price-currency">{symbol}</span>
                      {amount}
                    </dd>
                  </div>
                )}
              </dl>

              {quoteError && quoteError.code !== 'invalid_coupon' && (
                <p class="flow__inline-error">
                  The exact total couldn't be confirmed just now. You will see the final amount on
                  the payment page before anything is charged.
                </p>
              )}

              {submitError && (
                <div class="notice notice-danger flow__summary" role="alert">
                  <div>
                    <strong>{describe(submitError).heading}</strong>
                    <p>{describe(submitError).body}</p>
                  </div>
                </div>
              )}

              <div class="flow__actions">
                <button
                  type="button"
                  class="btn btn-quiet"
                  onClick={() => goTo(2)}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  onClick={() => void submit()}
                  disabled={submitting || !slot}
                >
                  {submitting ? 'Taking you to payment…' : 'Continue to payment'}
                </button>
              </div>

              <p class="flow__fine">
                The time is held for you while you pay. If payment is not completed the hold
                lapses and the time is offered to others again.
              </p>
            </section>
          )}
        </div>

        {/* ── Running summary ────────────────────────────────────────── */}
        <aside class="summary" aria-label="Your booking so far">
          <p class="eyebrow">Your booking</p>
          <h2 class="summary__title">{service.title}</h2>

          <dl class="summary__facts">
            <div>
              <dt>Length</dt>
              <dd>{formatDuration(service.duration_min)}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {slot && selectedDate
                  ? `${formatDate(`${selectedDate}T12:00:00Z`, 'UTC', 'en-GB', {
                      day: 'numeric',
                      month: 'long',
                    })}, ${slot.label}`
                  : 'Not chosen yet'}
              </dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatMoney(totalCents, currency)}</dd>
            </div>
          </dl>

          <p class="summary__fine">
            Free to move or cancel up to 24 hours before the appointed time.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Field — one input, its label, help text and error, wired for a11y.
   ═══════════════════════════════════════════════════════════════════════ */

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onInput: (value: string) => void;
  type?: string;
  textarea?: boolean;
  error?: string;
  help?: string;
  optional?: boolean;
  autocomplete?: string;
}

function Field({
  id,
  label,
  value,
  onInput,
  type = 'text',
  textarea = false,
  error,
  help,
  optional = false,
  autocomplete,
}: FieldProps) {
  const describedBy = [error ? `${id}-error` : null, help ? `${id}-help` : null]
    .filter(Boolean)
    .join(' ');

  const shared = {
    id,
    name: id,
    value,
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': describedBy || undefined,
    autocomplete,
    onInput: (event: Event) =>
      onInput((event.target as HTMLInputElement | HTMLTextAreaElement).value),
  };

  return (
    <div class="field">
      <label class="label" for={id}>
        {label}
        {optional && <span class="field__optional"> — optional</span>}
      </label>

      {textarea ? (
        <textarea class="textarea" rows={4} {...shared} />
      ) : (
        <input class="input" type={type} {...shared} />
      )}

      {help && (
        <p class="help" id={`${id}-help`}>
          {help}
        </p>
      )}
      {error && (
        <p class="error-text" id={`${id}-error`}>
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
