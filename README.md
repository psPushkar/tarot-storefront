# Aurelia Sable — storefront

A bespoke, dark, editorial website for an independent tarot practitioner, built on
[Astro](https://astro.build) and talking to the Storefront API v1 for its
catalogue, availability, pricing, checkout and customer portal.

The design direction is **"Gilt Veil"**: nocturnal matte surfaces, a single warm
gilt accent, hairline rules, and geometry instead of literal mysticism. The full
specification — tokens, motifs, component states, motion language and page-by-page
art direction — is worth reading before changing anything visual.

---

## Getting started

```bash
npm install
cp .env.example .env      # then fill it in
npm run dev               # http://localhost:4321
```

The site **builds and looks finished with no configuration at all.** Until you
supply credentials it runs in demo mode against a bundled catalogue, so you can
develop, screenshot and demo it before the backend exists.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm run check` | Astro + TypeScript diagnostics |

> **Note on this machine.** Node was not installed globally, so a portable copy
> lives at `C:\Users\singpush\.local\tools\node`. Either add that folder to your
> PATH, or prefix commands:
> `& "C:\Users\singpush\.local\tools\node\node.exe" .\node_modules\astro\bin\astro.mjs dev`

---

## Configuration

Everything lives in `.env`. Copy `.env.example` and fill it in.

| Variable | Required | Purpose |
|---|:--:|---|
| `PUBLIC_SITE_URL` | yes | Canonical public URL of *this* site. Drives canonical tags, OpenGraph URLs, the sitemap and the Stripe return URL. While it is left as `example.com` the site emits `noindex` and a disallow-all `robots.txt`, so a half-configured deployment can never be indexed. |
| `PUBLIC_API_BASE_URL` | yes | Platform deployment including the version path, e.g. `https://app.example.com/api/v1`. |
| `PUBLIC_API_KEY` | yes | Public storefront key from **Admin → API keys**. Must start `pk_`. |
| `PUBLIC_DEMO_MODE` | no | `true` forces the bundled demo catalogue. `false` forces live calls even without credentials, which is how you exercise the real error states. Unset means "demo when credentials are missing". |
| `PUBLIC_API_TIMEOUT_MS` | no | Defaults to `8000`. |

### Two things must be done on the platform side

1. **Register this site's origin** under *Admin → API → Allowed origins*. There
   is no CORS wildcard; without this the browser blocks every response.
2. **Connect Stripe and an email transport.** Without them `POST /bookings`
   returns `503 payments_unavailable` and the contact form returns
   `503 email_unavailable`. The site handles both gracefully — it shows a
   composed "not taking bookings yet" state rather than a broken form — but no
   booking can complete.

### Why the API key is in the browser

A `pk_` key grants exactly what an anonymous visitor may do, and the platform
scopes every query to the workspace it identifies. It is designed to be shipped
in client JavaScript. **An `sk_` key must never appear in this project.**

---

## Architecture

```
src/
  lib/
    types.ts        Every API entity, typed from the reference
    result.ts       Result<T> — the discriminated envelope every call returns
    api.ts          One wrapper per endpoint. Never throws.
    config.ts       Env resolution, upload URLs, absolute URLs
    demo.ts         Bundled demo catalogue (demo mode only)
    brand.ts        /profile resolved once per build, with a safe fallback
    catalogue.ts    /services and /reviews cached per build
    session.ts      Browser credential storage (customer + guest booking tokens)
    schema.ts       JSON-LD builders
    format.ts       Money, dates, durations, status labels
    content.ts      All original written content: essays, FAQ, about, intros
  components/
    islands/        Preact components — the only client-side JavaScript
  layouts/
    Base.astro      Site shell: nav, footer, SEO, scroll reveal
    Focus.astro     Stripped shell for the booking flow
  styles/
    global.css      The entire design system as Tailwind v4 @theme tokens
```

### Static, with live islands

The site is `output: 'static'`. The catalogue, profile and reviews are fetched
**at build time** — the reference states they change rarely and are safe to
cache — so they are real HTML for search engines. Everything genuinely live runs
in a Preact island in the browser:

| Island | Endpoints |
|---|---|
| `BookingFlow` | `/availability/days`, `/availability`, `/quote`, `POST /bookings` |
| `BookingConfirmation` | polls `GET /bookings/:uuid` |
| `BookingLookup` | `GET /bookings/:uuid`, cancel, reschedule |
| `AuthPanel` | `/auth/*` |
| `AccountDashboard`, `BookingDetail` | `/me/*` |
| `ContactForm` | `POST /contact` |

Availability is never cached, in line with the reference.

**Rebuild when the catalogue changes.** Because services and profile are baked
at build time, adding or renaming a service requires a redeploy. Wire your host's
deploy hook to the platform if you want that automatic.

### Failure is a designed state, not an exception

`src/lib/api.ts` never throws for an expected failure. Every call returns
`Result<T>`, and transport failures — DNS, CORS, timeouts — are normalised into
the same `ApiFailure` shape as a server error, so one code path handles them all.

Two helpers separate the two kinds of bad news, because they deserve different
tones of voice:

- `isNotReady(error)` — the practitioner has not finished setting up
  (`payments_unavailable`, `email_unavailable`, `not_configured`). Calm and
  explanatory.
- `isTransient(error)` — worth trying again (`network_error`, `timeout`,
  `server_error`, `rate_limited`).

Every non-happy path routes through `StateBlock.astro` or a local copy table
inside an island. **The raw `error.message` from the server is never shown to a
visitor** — each island maps error codes to written copy. States covered:
practitioner on vacation, no services published, no slots on a date, payments not
connected, email not connected, rate limited, session expired, slot taken while
paying, invalid coupon, network failure, and 404.

To see them, set `PUBLIC_DEMO_MODE=false` with no API URL and browse the site.

---

## Imagery

There are two kinds of image on this site, and they are handled quite differently.

### Drawn artwork (no files, no licences)

The tarot cards, the astrological chart wheels, the ornaments and the
OpenGraph card are all **drawn in code** — inline SVG in the Gilt Veil palette.
They weigh nothing, scale to any size, can never be mis-licensed, and can never
clash with the design.

| Component | Where it appears |
|---|---|
| `TarotCard.astro` | The hero fan, the service rail, the blank card on 404 |
| `CardFan.astro` | Home hero — five cards on an arc with pointer parallax and a slow float |
| `ChartWheel.astro` | The rail on chart-based (astrology) readings |
| `Ornament.astro` | Stars, dividers, corner flourishes, vesica |

Card faces are *geometric interpretations* of the major arcana, not
reproductions of any published deck. Each reading is assigned a face
deterministically from its slug, so a given service always shows the same card.

### Photographs

Eight photographs live in `src/assets/photos/`, catalogued in `src/lib/photos.ts`
with alt text, photographer and measured luminance. All are under the
**Unsplash License** (free commercial use, attribution not required). Credits are
listed on `/legal` anyway.

Every photo goes through `Photo.astro`, which exists because dropping a stock
photograph onto a near-black page is exactly what makes a dark site look cheap.
It:

- crops to a fixed ratio so nothing shifts as images load;
- dims, desaturates and warms the image toward the gilt accent;
- lays a gradient tint, a gold hairline and an inner vignette over it;
- emits a responsive, lazily-loaded WebP srcset through Astro's asset pipeline.

`treatment="wash"` plus `fill` turns a photo into a section backdrop. Backdrops
are capped at 640px and encoded at quality 50 — they are blurred and overscaled
in CSS, so anything sharper is bytes the visitor cannot perceive. That single
rule took the FAQ page from 446 kB of imagery to 41 kB.

Every photograph was checked to have an average luminance under 100/255 before
being accepted, so none of them punches a bright hole in the page.

**To swap in your own photographs:** drop files into `src/assets/photos/`, add
them to `photos.ts` with real alt text, and reference them. The practitioner's
own portrait needs no work at all — it comes from `photo_key` on `/profile` and
is used automatically on the About page and as the OpenGraph image.

---

## SEO

- Per-page titles, descriptions, canonicals and OpenGraph via `Seo.astro`.
- JSON-LD: `ProfessionalService` (with a real `AggregateRating` derived from
  published reviews — never invented), `Person`, `Service` + `Offer` per reading,
  `ItemList`, `Review`, `FAQPage`, `Article`, `WebSite` and `BreadcrumbList`.
- `sitemap-index.xml` generated at build, with the account and booking areas
  excluded.
- `robots.txt` generated at build; disallows `/account/` and `/booking/`.
- RSS feed for the journal at `/journal/rss.xml`.
- Self-hosted variable fonts — no third-party font requests.
- Semantic landmarks, one `<h1>` per page, and a skip link.

Add an OpenGraph image at `public/og.png` (1200×630) to improve link previews;
until then the practitioner's profile photo is used when one is set.

---

## Accessibility

- Every text/background pair in the palette meets WCAG AA; the contrast table is
  in the design spec.
- Visible focus rings, a focus-trapped mobile drawer, and `aria-current` on nav.
- `prefers-reduced-motion` is honoured throughout: transforms are dropped, only
  opacity transitions remain, and the scroll indicator stops.
- The whole site is readable and navigable without JavaScript. Only the booking
  flow requires it, and it says so plainly in a `<noscript>` block with an
  alternative route.

---

## Deploying

Any static host works — Netlify, Vercel, Cloudflare Pages, S3, nginx.

```bash
npm run build     # → dist/
```

Set the three `PUBLIC_*` variables in your host's build environment, register the
deployed origin with the platform, and redeploy whenever the catalogue changes.

---

## Content

All prose — the five journal essays, the FAQ, the about narrative and every page
introduction — lives in `src/lib/content.ts` as typed data. It is original
writing, not lorem ipsum, and it is meant to be edited rather than replaced: the
voice is deliberately poised and specific, and the pages are laid out assuming
sentences of roughly that length.
