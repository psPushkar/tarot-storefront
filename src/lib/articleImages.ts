/**
 * Which photograph belongs to which article.
 *
 * Kept apart from `photos.ts` (the catalogue of what we have) so the editorial
 * decision of what illustrates what lives on its own, and so an article without
 * an assignment degrades to no image rather than to a wrong one.
 */

import { photos } from './photos';
import type { Photo } from './photos';

const ASSIGNMENTS: Record<string, Photo> = {
  'what-a-tarot-reading-can-and-cannot-do': photos.candleDark,
  'how-to-arrive-at-a-good-question': photos.candleGlow,
  'on-the-tower-and-frightening-cards': photos.nightSky,
  'reading-for-grief': photos.driedFlowers,
  'a-short-history-of-the-tarot-deck': photos.oldBooks,
};

/**
 * The photo for an article, or null when none is assigned. Callers must handle
 * null — an unillustrated article should still lay out correctly.
 */
export function articlePhoto(slug: string): Photo | null {
  return ASSIGNMENTS[slug] ?? null;
}
