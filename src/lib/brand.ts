/**
 * Brand resolution.
 *
 * Every page needs the practitioner's name, timezone, currency and policies.
 * Rather than have each page fetch `/profile` independently, this module
 * resolves it once per build and hands out a *guaranteed* profile object:
 * either the real one, or a neutral fallback that renders without a single
 * "undefined" appearing on the page.
 *
 * `ok` tells a page whether the data is genuine, so it can decide whether to
 * show a section at all, without ever having to null-check the profile itself.
 */

import { getProfile } from './api';
import { config } from './config';
import type { ApiFailure } from './result';
import type { Profile } from './types';

/** What the site falls back to when the practitioner's profile cannot load. */
const FALLBACK_PROFILE: Profile = {
  site_name: 'Aurelia Sable',
  display_name: 'Aurelia',
  tagline: 'Readings for the question beneath the question.',
  bio: '',
  photo_key: '',
  logo_key: '',
  timezone: 'UTC',
  currency: 'EUR',
  languages: [],
  specialties: [],
  socials: {},
  branding: {},
  policies: {},
  booking: {},
  vacation: { active: false, message: '', until: '' },
};

export interface Brand {
  profile: Profile;
  /** True when `profile` came from the API rather than the fallback. */
  ok: boolean;
  /** True when the data came from the bundled demo catalogue. */
  demo: boolean;
  error?: ApiFailure;
  /** Convenience: the practitioner is on vacation and not taking bookings. */
  onVacation: boolean;
}

let cache: Promise<Brand> | null = null;

async function resolve(): Promise<Brand> {
  const result = await getProfile();

  if (!result.ok) {
    return { profile: FALLBACK_PROFILE, ok: false, demo: false, error: result.error, onVacation: false };
  }

  // Merge over the fallback so a sparsely-filled profile still renders. The
  // API omits empty optional fields entirely, so this is not defensive
  // paranoia — it is the documented shape.
  const profile: Profile = {
    ...FALLBACK_PROFILE,
    ...result.data,
    socials: { ...FALLBACK_PROFILE.socials, ...result.data.socials },
    branding: { ...FALLBACK_PROFILE.branding, ...result.data.branding },
    policies: { ...FALLBACK_PROFILE.policies, ...result.data.policies },
    booking: { ...FALLBACK_PROFILE.booking, ...result.data.booking },
    vacation: {
      active: Boolean(result.data.vacation?.active),
      message: result.data.vacation?.message ?? '',
      until: result.data.vacation?.until ?? '',
    },
  };

  return {
    profile,
    ok: true,
    demo: result.demo,
    onVacation: Boolean(profile.vacation?.active),
  };
}

/** Resolved once per build; every page shares the same answer. */
export function getBrand(): Promise<Brand> {
  if (!cache) cache = resolve();
  return cache;
}

/** The site name, used in <title> suffixes and structured data. */
export async function brandName(): Promise<string> {
  const { profile } = await getBrand();
  return profile.site_name || profile.display_name || 'Tarot readings';
}

export { config };
