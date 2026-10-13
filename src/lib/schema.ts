/**
 * JSON-LD builders.
 *
 * Search engines are one of the two ways anyone finds an independent
 * practitioner, so structured data is treated as a first-class output here
 * rather than an afterthought. Every builder returns a plain object; the
 * `<Seo>` component serialises it.
 *
 * Rules observed throughout:
 *  - Never emit a field we do not actually have. An empty string in JSON-LD is
 *    worse than an absent key.
 *  - Never emit `aggregateRating` without real reviews behind it — inventing
 *    one is a policy violation, not merely bad manners.
 */

import { absoluteUrl } from './config';
import type { Profile, Review, Service } from './types';

type Json = Record<string, unknown>;

/** Strip keys whose values are empty, so no hollow fields reach the output. */
function compact(input: Json): Json {
  const out: Json = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

function socialLinks(profile: Profile): string[] {
  return Object.values(profile.socials ?? {}).filter(
    (url): url is string => typeof url === 'string' && url.startsWith('http'),
  );
}

/** Minor units → a decimal string, as Schema.org expects. */
function priceString(cents: number, currency: string): string {
  let digits = 2;
  try {
    digits =
      new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
  } catch {
    digits = 2;
  }
  return (cents / 10 ** digits).toFixed(digits);
}

/* ── Organisation / practitioner ───────────────────────────────────────── */

export function professionalServiceSchema(
  profile: Profile,
  reviews: Review[],
  photoUrl: string | null,
): Json {
  const rated = reviews.filter((r) => Number.isFinite(r.rating));
  const aggregate =
    rated.length > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: (rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1),
          reviewCount: rated.length,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return compact({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${absoluteUrl('/')}#practice`,
    name: profile.site_name,
    alternateName: profile.display_name,
    description: profile.tagline,
    url: absoluteUrl('/'),
    image: photoUrl ?? undefined,
    priceRange: '$$',
    availableLanguage: profile.languages,
    knowsAbout: profile.specialties,
    sameAs: socialLinks(profile),
    areaServed: { '@type': 'Place', name: 'Worldwide (online)' },
    aggregateRating: aggregate,
    provider: compact({
      '@type': 'Person',
      name: profile.display_name || profile.site_name,
      jobTitle: 'Tarot reader',
      image: photoUrl ?? undefined,
      sameAs: socialLinks(profile),
    }),
  });
}

export function personSchema(profile: Profile, photoUrl: string | null): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${absoluteUrl('/about')}#person`,
    name: profile.display_name || profile.site_name,
    jobTitle: 'Tarot reader',
    description: profile.tagline,
    image: photoUrl ?? undefined,
    url: absoluteUrl('/about'),
    knowsLanguage: profile.languages,
    knowsAbout: profile.specialties,
    sameAs: socialLinks(profile),
  });
}

/* ── Catalogue ─────────────────────────────────────────────────────────── */

export function serviceSchema(service: Service, profile: Profile, url: string): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.title,
    description: service.description,
    serviceType: 'Tarot reading',
    url,
    provider: { '@id': `${absoluteUrl('/')}#practice` },
    audience: { '@type': 'Audience', audienceType: 'Adults' },
    offers: compact({
      '@type': 'Offer',
      price: priceString(service.price_cents, service.currency),
      priceCurrency: service.currency,
      availability: 'https://schema.org/OnlineOnly',
      url,
      category: 'Consultation',
    }),
    termsOfService: profile.policies?.cancellation || undefined,
  });
}

export function itemListSchema(services: Service[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Readings offered',
    numberOfItems: services.length,
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/services/${service.slug}`),
      name: service.title,
    })),
  };
}

/* ── Reviews ───────────────────────────────────────────────────────────── */

export function reviewsSchema(reviews: Review[], profile: Profile): Json | null {
  if (reviews.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Reviews of ${profile.site_name}`,
    itemListElement: reviews.slice(0, 20).map((review, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: compact({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: review.comment,
        datePublished: review.created_at?.slice(0, 10),
        itemReviewed: { '@id': `${absoluteUrl('/')}#practice` },
      }),
    })),
  };
}

/* ── Editorial ─────────────────────────────────────────────────────────── */

export function faqSchema(items: { question: string; answer: string }[]): Json | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function articleSchema(
  article: { title: string; dek: string; publishedAt: string; slug: string },
  profile: Profile,
  wordCount: number,
): Json {
  const url = absoluteUrl(`/journal/${article.slug}`);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.dek,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    wordCount,
    inLanguage: 'en',
    mainEntityOfPage: url,
    url,
    author: { '@id': `${absoluteUrl('/about')}#person`, '@type': 'Person', name: profile.display_name },
    publisher: { '@id': `${absoluteUrl('/')}#practice` },
  });
}

/* ── Navigation ────────────────────────────────────────────────────────── */

export function breadcrumbSchema(trail: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function websiteSchema(profile: Profile): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    name: profile.site_name,
    url: absoluteUrl('/'),
    inLanguage: 'en',
    publisher: { '@id': `${absoluteUrl('/')}#practice` },
  };
}
