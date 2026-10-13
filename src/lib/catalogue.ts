/**
 * Build-time catalogue cache.
 *
 * `/services`, `/profile` and `/reviews` change rarely and are explicitly safe
 * to fetch at build time. Every page needs some of them, so each is resolved
 * exactly once per build and shared, rather than issuing one request per page.
 *
 * Availability is deliberately absent from this module — it must never be
 * cached, and is always fetched live in the browser.
 */

import { getReviews, getServices } from './api';
import type { ApiFailure } from './result';
import type { Review, Service } from './types';

export interface Catalogue {
  services: Service[];
  ok: boolean;
  demo: boolean;
  error?: ApiFailure;
}

export interface Reviews {
  reviews: Review[];
  ok: boolean;
  demo: boolean;
  error?: ApiFailure;
}

let catalogueCache: Promise<Catalogue> | null = null;
let reviewsCache: Promise<Reviews> | null = null;

export function getCatalogue(): Promise<Catalogue> {
  if (!catalogueCache) {
    catalogueCache = getServices().then((result) =>
      result.ok
        ? { services: result.data, ok: true, demo: result.demo }
        : { services: [], ok: false, demo: false, error: result.error },
    );
  }
  return catalogueCache;
}

export function getCachedReviews(): Promise<Reviews> {
  if (!reviewsCache) {
    reviewsCache = getReviews().then((result) =>
      result.ok
        ? { reviews: result.data, ok: true, demo: result.demo }
        : { reviews: [], ok: false, demo: false, error: result.error },
    );
  }
  return reviewsCache;
}

/** Mean rating across published reviews, or null when there are none. */
export function averageRating(reviews: Review[]): number | null {
  const rated = reviews.filter((review) => Number.isFinite(review.rating));
  if (rated.length === 0) return null;
  return rated.reduce((sum, review) => sum + review.rating, 0) / rated.length;
}

/**
 * Order the catalogue for display: live sessions first, then recorded and
 * written, each group cheapest-first. A visitor scanning the page should meet
 * the flagship formats before the asynchronous ones.
 */
export function sortForDisplay(services: Service[]): Service[] {
  const rank: Record<string, number> = { live_video: 0, phone: 1, recorded: 2, written: 3 };
  return [...services].sort((a, b) => {
    const groupDelta = (rank[a.type] ?? 9) - (rank[b.type] ?? 9);
    if (groupDelta !== 0) return groupDelta;
    return a.price_cents - b.price_cents;
  });
}

/** Group services by delivery format, preserving display order. */
export function groupByType(services: Service[]): { type: string; services: Service[] }[] {
  const groups = new Map<string, Service[]>();
  for (const service of sortForDisplay(services)) {
    const bucket = groups.get(service.type);
    if (bucket) bucket.push(service);
    else groups.set(service.type, [service]);
  }
  return [...groups.entries()].map(([type, list]) => ({ type, services: list }));
}
