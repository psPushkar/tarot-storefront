/**
 * Bundled demo catalogue.
 *
 * Used only when `config.isDemo` is true — that is, before real credentials are
 * configured, or when `PUBLIC_DEMO_MODE=true` is set deliberately. It exists so
 * the site always builds and always renders a finished, believable page rather
 * than a skeleton of empty states during development.
 *
 * Nothing here is fetched at runtime in a live deployment. The moment
 * `PUBLIC_API_BASE_URL` and `PUBLIC_API_KEY` are set, every one of these is
 * bypassed in favour of the real API.
 */

import { fail, ok } from './result';
import type { Result } from './result';
import type {
  Availability,
  AvailabilityDays,
  Profile,
  Quote,
  QuoteRequest,
  Review,
  ServiceDetail,
  Workspace,
} from './types';

export const workspace: Workspace = {
  id: '3018edb5-e37c-48b1-b4cb-7965dc0d1326',
  slug: 'aurelia-sable',
  name: 'Aurelia Sable',
  plan: 'pro',
};

export const profile: Profile = {
  site_name: 'Aurelia Sable',
  display_name: 'Aurelia',
  tagline: 'Readings for the question beneath the question.',
  bio: `I have been reading cards for nineteen years, the last eleven of them professionally, from a small room in Lisbon with a west-facing window and far too many books.

I came to tarot sideways. I was writing a doctorate on medieval iconography — on how a single image can hold a whole argument — and a friend put a deck in my hands to make a point about symbols. She was right. I never finished the doctorate.

What I do is not fortune-telling. I do not think the future is a fixed thing waiting to be read off a card, and I will not tell you that it is. What the cards do, reliably and sometimes uncomfortably, is externalise. They put the shape of a situation on the table where you can walk around it. Most people arrive with a question they have already half-answered and have not yet let themselves hear. My work is mostly listening, and then saying the thing plainly.

I read for people at turning points: leaving something, choosing between two goods, grieving, beginning again at an age when beginning again is supposed to be over. I read in English and Portuguese. I am direct, I am not solemn, and I will never tell you something frightening for effect.`,
  photo_key: '',
  logo_key: '',
  timezone: 'Europe/Lisbon',
  currency: 'EUR',
  languages: ['en', 'pt'],
  specialties: ['tarot', 'astrology'],
  socials: {
    instagram: 'https://instagram.com/',
    facebook: '',
    tiktok: '',
    youtube: '',
    website: '',
  },
  branding: { primary_color: '#C9A55C', theme: 'classic', font: 'Cormorant Garamond' },
  policies: {
    cancellation:
      'Sessions may be cancelled or moved free of charge up to 24 hours before the appointed time. Inside that window the fee is retained, because the hour has been held for you and cannot be offered to anyone else.',
    refund:
      'If a session cannot go ahead for a reason on my side — illness, a failure of technology, anything at all — it is refunded in full, immediately and without discussion.',
    disclaimer:
      'Readings are offered for reflection and personal insight. They are not a substitute for medical, legal, financial or psychological advice, and I will always say so plainly if a question belongs with a professional in one of those fields.',
  },
  booking: { min_notice_hours: 12, max_horizon_days: 60 },
  vacation: { active: false, message: '', until: '' },
};

export const services: ServiceDetail[] = [
  {
    id: 'svc-threshold',
    slug: 'threshold-reading',
    title: 'The Threshold Reading',
    description:
      'Forty-five minutes on one question you are standing at the edge of. A tight, deliberate spread and an honest conversation about what it shows. The right choice when something specific is pressing and you want it looked at properly.',
    duration_min: 45,
    price_cents: 9500,
    currency: 'EUR',
    type: 'live_video',
    intake_type: 'tarot',
    addons: [
      { id: 'addon-summary', title: 'Written summary, sent within 48 hours', price_cents: 2500 },
      { id: 'addon-recording', title: 'Audio recording of the session', price_cents: 1500 },
    ],
    questions: [
      {
        id: 'q-threshold-focus',
        question: 'What would you like the reading to focus on?',
        required: true,
      },
      {
        id: 'q-threshold-context',
        question: 'Is there anything I should know before we begin?',
        required: false,
      },
    ],
  },
  {
    id: 'svc-full-life',
    slug: 'full-life-reading',
    title: 'The Full Life Reading',
    description:
      'Ninety minutes across the whole board — work, love, money, health, the things you have not said out loud. Your birth chart is read alongside the cards, so the reading has both a shape and a season. This is the deep one, and the one most people come back for.',
    duration_min: 90,
    price_cents: 18000,
    currency: 'EUR',
    type: 'live_video',
    intake_type: 'astrology',
    addons: [
      { id: 'addon-chart', title: 'Printed natal chart, posted to you', price_cents: 3500 },
      { id: 'addon-summary-long', title: 'Written summary, sent within 48 hours', price_cents: 3000 },
      { id: 'addon-followup', title: 'Thirty-minute follow-up, within three months', price_cents: 5500 },
    ],
    questions: [
      {
        id: 'q-life-areas',
        question: 'Which areas of your life feel most alive right now?',
        required: true,
      },
      {
        id: 'q-life-avoid',
        question: 'Is there anything you would rather I did not raise?',
        required: false,
      },
    ],
  },
  {
    id: 'svc-year-ahead',
    slug: 'the-year-ahead',
    title: 'The Year Ahead',
    description:
      'A seventy-five minute reading structured month by month across the coming year, drawn against your solar return. Useful if you are planning something — a move, a launch, a leaving — and want a sense of timing rather than a verdict.',
    duration_min: 75,
    price_cents: 15000,
    currency: 'EUR',
    type: 'live_video',
    intake_type: 'astrology',
    addons: [
      { id: 'addon-year-doc', title: 'Month-by-month written document', price_cents: 4000 },
    ],
    questions: [
      {
        id: 'q-year-plan',
        question: 'Is there a decision or a date the year is arranged around?',
        required: true,
      },
    ],
  },
  {
    id: 'svc-letter',
    slug: 'the-written-reading',
    title: 'The Written Reading',
    description:
      'No call, no camera. You send one question; I sit with it, draw for it, and write you a considered letter of a thousand words or so within five days. For people who think better on the page, or who live seven time zones away.',
    duration_min: 60,
    price_cents: 7000,
    currency: 'EUR',
    type: 'written',
    intake_type: 'tarot',
    questions: [
      {
        id: 'q-letter-question',
        question: 'What is your question? Take as much space as you need.',
        required: true,
      },
    ],
  },
  {
    id: 'svc-voice',
    slug: 'the-voice-note',
    title: 'The Voice Note',
    description:
      'A single card, drawn for a single question, and a recorded reply of fifteen or twenty minutes that lands in your inbox within two days. Small, inexpensive, and the usual way people find out whether we work well together.',
    duration_min: 20,
    price_cents: 4500,
    currency: 'EUR',
    type: 'recorded',
    intake_type: 'tarot',
    questions: [
      { id: 'q-voice-question', question: 'What is your question?', required: true },
    ],
  },
  {
    id: 'svc-numbers',
    slug: 'the-name-and-number',
    title: 'The Name and Number',
    description:
      'A sixty-minute numerological reading of your name and birth date, cross-read with the cards. An unusual angle, and a good one if you are renaming something — yourself, a business, a body of work.',
    duration_min: 60,
    price_cents: 12000,
    currency: 'EUR',
    type: 'phone',
    intake_type: 'numerology',
    questions: [
      {
        id: 'q-numbers-name',
        question: 'Which name should I work from — the given one, or the one you use?',
        required: true,
      },
    ],
  },
];

export const reviews: Review[] = [
  {
    rating: 5,
    comment:
      'I booked expecting to be told something comforting and was instead told something true, which turned out to be what I actually wanted. Six months on, I have made the change we talked about.',
    created_at: '2026-05-02T09:12:00Z',
  },
  {
    rating: 5,
    comment:
      'Aurelia does not perform. There is no incense, no theatre, no long pauses for effect. She looked at the cards, told me what she saw, and then asked a question that I have been thinking about ever since.',
    created_at: '2026-04-18T16:40:00Z',
  },
  {
    rating: 5,
    comment:
      'The written reading was worth three times what I paid. It arrived as a proper letter — argued, specific, and quietly devastating in the second half.',
    created_at: '2026-04-03T11:05:00Z',
  },
  {
    rating: 4,
    comment:
      'Very good, though I would say book the ninety minutes rather than the forty-five. We had only got properly started when the time went.',
    created_at: '2026-03-21T19:22:00Z',
  },
  {
    rating: 5,
    comment:
      'I have been to readers who tell you what you want to hear and readers who frighten you into rebooking. She is neither. She was kind about a situation I had been too embarrassed to describe to anyone.',
    created_at: '2026-03-09T08:55:00Z',
  },
  {
    rating: 5,
    comment:
      'The year-ahead reading gave me a sense of timing I did not have before. I stopped forcing something in February that clearly wanted to happen in June. It happened in June.',
    created_at: '2026-02-14T14:30:00Z',
  },
  {
    rating: 5,
    comment:
      'Third reading over two years. What I value most is that she remembers, and that she will tell me when I am asking the same question in a new costume.',
    created_at: '2026-01-27T10:10:00Z',
  },
  {
    rating: 4,
    comment:
      'Thoughtful and unhurried. The recording afterwards was useful — I caught several things on the second listen that went past me on the call.',
    created_at: '2025-12-11T17:45:00Z',
  },
];

/* ── Synthetic availability ────────────────────────────────────────────── */

/** Deterministic hash so a given date always produces the same demo schedule. */
function seed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function serviceBySlug(slug: string): ServiceDetail | undefined {
  return services.find((s) => s.slug === slug);
}

/**
 * Demo opening hours: closed Sundays, closed Mondays, and a shorter Saturday.
 * Slots respect the service duration plus a 15-minute prep buffer, mirroring
 * the way the real endpoint spaces them.
 */
function startHoursFor(dateKey: string): number[] {
  const day = new Date(`${dateKey}T12:00:00Z`).getUTCDay();
  if (day === 0 || day === 1) return [];
  if (day === 6) return [10, 12];
  const rng = seed(dateKey) % 4;
  if (rng === 0) return [10, 12, 15];
  if (rng === 1) return [9, 11, 14, 16];
  if (rng === 2) return [11, 14, 16];
  return [10, 13, 15, 17];
}

export function availabilityFor(serviceSlug: string, date?: string): Availability {
  const dateKey = date || toDateKey(new Date());
  const service = serviceBySlug(serviceSlug);
  if (!service) return { date: dateKey, service: serviceSlug, slots: [] };

  const slots = startHoursFor(dateKey).map((hour) => {
    const start = new Date(`${dateKey}T${String(hour).padStart(2, '0')}:00:00Z`);
    const end = new Date(start.getTime() + service.duration_min * 60_000);
    return {
      start_at: start.toISOString().replace('.000', ''),
      end_at: end.toISOString().replace('.000', ''),
      label: `${((hour + 11) % 12) + 1}:00 ${hour < 12 ? 'AM' : 'PM'}`,
    };
  });

  return { date: dateKey, service: serviceSlug, slots };
}

export function availabilityDaysFor(
  serviceSlug: string,
  from?: string,
  to?: string,
): AvailabilityDays {
  const start = from ? new Date(`${from}T00:00:00Z`) : new Date();
  const end = to ? new Date(`${to}T00:00:00Z`) : new Date(start.getTime() + 30 * 86_400_000);
  const days: AvailabilityDays['days'] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const limit = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const today = new Date();
  const todayKey = toDateKey(today);

  let guard = 0;
  while (cursor <= limit && guard++ < 62) {
    const key = toDateKey(cursor);
    // The demo honours minimum notice the same way the API does: today and any
    // past date are never offered.
    const count = key <= todayKey ? 0 : startHoursFor(key).length;
    days.push({ date: key, slot_count: count, available: count > 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return { service: serviceSlug, days };
}

/* ── Synthetic quote ───────────────────────────────────────────────────── */

const DEMO_COUPONS: Record<string, { label: string; percent: number }> = {
  FIRSTLIGHT: { label: 'Coupon FIRSTLIGHT', percent: 10 },
};

export function quoteFor(request: QuoteRequest): Result<Quote> {
  const service = serviceBySlug(request.service);
  if (!service) {
    return fail({ code: 'not_found', status: 404, message: 'Resource not found.' });
  }

  const adjustments: Quote['adjustments'] = [];
  let total = service.price_cents;

  for (const addonId of request.addons ?? []) {
    const addon = service.addons?.find((a) => a.id === addonId);
    if (!addon) {
      return fail({
        code: 'invalid_addon',
        status: 422,
        message: 'One of the selected extras is no longer available.',
      });
    }
    if (adjustments.some((a) => a.type === 'addon' && a.label === addon.title)) continue;
    adjustments.push({ type: 'addon', label: addon.title, delta_cents: addon.price_cents });
    total += addon.price_cents;
  }

  const code = request.coupon_code?.trim().toUpperCase();
  if (code) {
    const coupon = DEMO_COUPONS[code];
    if (!coupon) {
      return fail({
        code: 'invalid_coupon',
        status: 422,
        message: 'That code is not valid, or it has expired.',
      });
    }
    const delta = -Math.round((total * coupon.percent) / 100);
    adjustments.push({ type: 'coupon', label: coupon.label, delta_cents: delta });
    total += delta;
  }

  adjustments.push({ type: 'rounding', label: 'Rounding', delta_cents: 0 });

  return ok(
    {
      service: service.slug,
      currency: service.currency,
      base_cents: service.price_cents,
      total_cents: total,
      coupon_code: code && DEMO_COUPONS[code] ? code : undefined,
      adjustments,
    },
    true,
  );
}
