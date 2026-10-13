import type { ImageMetadata } from 'astro';

import candleDark from '../assets/photos/candle-dark.jpg';
import candleGlow from '../assets/photos/candle-glow.jpg';
import oldBooks from '../assets/photos/old-books.jpg';
import nightSky from '../assets/photos/night-sky.jpg';
import moonBlack from '../assets/photos/moon-black.jpg';
import driedFlowers from '../assets/photos/dried-flowers.jpg';
import darkMarble from '../assets/photos/dark-marble.jpg';
import blackVelvet from '../assets/photos/black-velvet.jpg';

export interface Photo {
  src: ImageMetadata;
  /** Descriptive alt text. Empty string ONLY for purely decorative use. */
  alt: string;
  /** Photographer name, for the credits page. */
  credit: string;
  /** Unsplash photo page URL. */
  creditUrl: string;
  /** Average luminance 0-255, measured at download time. */
  luminance: number;
}

export const photos = {
  candleDark: {
    src: candleDark,
    alt: 'A single candle flame burning in complete darkness, warm light falling softly on the surrounding shadows',
    credit: 'Rob Wicks',
    creditUrl: 'https://unsplash.com/photos/a-single-candle-is-lit-in-the-dark-J3H-rth8cck',
    luminance: 22,
  },
  candleGlow: {
    src: candleGlow,
    alt: 'A lit candle glowing faintly in a dark room, its amber light barely reaching the edges of the frame',
    credit: 'Sixteen Miles Out',
    creditUrl: 'https://unsplash.com/photos/a-single-lit-candle-glows-in-the-dark-QhlWFtwBBlI',
    luminance: 16,
  },
  oldBooks: {
    src: oldBooks,
    alt: 'Worn leather-bound books with faded gilt spines arranged on a shadowed shelf',
    credit: 'Paul Coenen',
    creditUrl: 'https://unsplash.com/photos/old-worn-books-with-faded-spines-on-a-shelf-uskbpKwCcx4',
    luminance: 101,
  },
  nightSky: {
    src: nightSky,
    alt: 'A deep black night sky dense with thousands of small bright stars',
    credit: 'Jake Weirick',
    creditUrl: 'https://unsplash.com/photos/the-night-sky-is-filled-with-stars-Q_RBVFFXR_g',
    luminance: 15,
  },
  moonBlack: {
    src: moonBlack,
    alt: 'A luminous crescent moon suspended against a pure black sky',
    credit: 'Raihan Mohammad',
    creditUrl: 'https://unsplash.com/photos/a-full-moon-in-the-dark-sky-with-a-black-background-qfNL_KqJeY4',
    luminance: 37,
  },
  driedFlowers: {
    src: driedFlowers,
    alt: 'A single dried flower stem silhouetted against a solid black background',
    credit: 'Andrey Soldatov',
    creditUrl: 'https://unsplash.com/photos/a-dried-flower-with-a-black-background-dSfoYdzDCck',
    luminance: 15,
  },
  darkMarble: {
    src: darkMarble,
    alt: 'Close-up of a black marble surface with subtle grey veining disappearing into shadow',
    credit: 'Annie Spratt',
    creditUrl: 'https://unsplash.com/photos/a-close-up-of-a-black-marble-surface-osuiatBDTww',
    luminance: 35,
  },
  blackVelvet: {
    src: blackVelvet,
    alt: 'Crumpled black fabric with deep folds catching faint light across its textured surface',
    credit: 'Cat Han',
    creditUrl: 'https://unsplash.com/photos/crumpled-black-fabric-texture-W_5Eakb1598',
    luminance: 10,
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof photos;

/** Every photo, for the credits list. */
export const photoCredits: Photo[] = Object.values(photos);
