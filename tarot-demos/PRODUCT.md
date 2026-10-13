# PRODUCT.md

Product truth for the storefront demos. Visual decisions live in DESIGN.md, written at
finish from the built world — not here.

## What this is

A set of competing **storefront designs** for a booking product sold to independent
consultation practitioners: tarot readers first, then astrologers, numerologists and
coaches, whose businesses have the same shape under different headings.

The product itself is two halves:

1. **An admin panel**, run as a hosted service. One deployment, each practitioner a
   workspace inside it. Booking engine, calendar, payments through the practitioner's own
   Stripe account, client records, reading delivery, reminders, analytics.
2. **A public booking website** per practitioner — what their clients actually see and
   book through. These demos are that half.

The admin panel also serves a standard booking site with six themes at no extra cost, so a
custom-designed storefront is the paid upgrade. That is why these designs exist and why
they must be visibly better than a theme.

## Who is looking at these demos

**Not the end client. The practitioner — and mainly an international one.**

The buyers are working consultation practitioners in the US, UK, Europe, Australia and
elsewhere, deciding whether to pay for a custom site instead of taking the included theme.
India is a market, not the market. **A design that reads as made for an Indian visitor is
mis-aimed.**

They are:

- Self-employed, usually alone, often booked through Instagram messages today.
- Visually literate and opinionated. Their brand is themselves, and a site that looks
  generic reads as an insult to their practice.
- Sceptical of anything that makes their work look like a novelty or a Halloween prop.
- Comparing designs side by side in one sitting, on a laptop, probably in the evening.
- Pricing in dollars, pounds or euros. **Lead with the dollar price; the rupee is
  secondary.**

Cultural grounding should come from the shared Anglo-European and international visual
world this audience reads daily, not from Indian-specific material. The demo
practitioner being based in Bangalore is a true detail of her own practice — it is not a
signal about who the site is designed for.

Success is one sentence: **they point at one and say "that one is me."**

## Visitor mode

**Persuade.** These pages exist to make a practitioner want this and act. Design is the
product being sold — the design *is* the argument.

Note the second audience: once built, the same page must also work as a real booking site
for that practitioner's own clients, who arrive at a crossroads and want to book a reading.
A design that wins the demo but cannot take a booking has failed.

## The content, fixed

All five demos carry identical content, held in `_content.json`, so the only variable is
design:

- **Practitioner:** Aurelia Sable — fictional, seventeen years reading, Bangalore, reads
  worldwide. Does not predict; reads what is already in motion.
- **Five readings:** The Threshold Reading ₹2,400 / 45 min · The Full Life Reading ₹4,800 /
  90 min · The Year Ahead ₹3,900 / 75 min · The Written Reading ₹1,800 / 3 days · The Voice
  Note ₹900 / 48 hours. Both rupee and dollar prices.
- **Four testimonials**, six FAQ entries, four booking steps, cancellation policy and a
  plain entertainment disclaimer.
- **Five pages each:** home, readings, about, booking, contact.

## Constraints that bind every design

- **No image files.** No photography can be licensed for this, and no image generation is
  available in this environment. Every visual must be authored in code: SVG, canvas, CSS,
  or WebGL. This is a hard limit, not a preference.
- **No build step, no framework.** Plain HTML, CSS and hand-written JavaScript. A demo must
  run by opening a file. Libraries may come from a CDN only where they earn their weight.
- **Must work as a real booking site**, not only as a showpiece: the booking flow needs a
  service picker, a date and time selector, and a form, all fully styled.
- **Accessible.** WCAG AA contrast, keyboard operable, reduced-motion honoured. The
  practitioner's clients include people booking at 2am in distress; the site cannot be
  hostile.
- **Responsive** at 1440, 768 and 375.

## What is true and must not be invented

Prices, durations, formats and policies above are the product's facts. Testimonials are
labelled demo content. **Nothing may claim a capability the admin panel does not have** —
no live chat, no video calls in-page, no AI-generated readings, no memberships. Payment is
card or UPI, charged once at booking.

## What would make a polished result feel wrong

- Anything that reads as costume occultism: skulls, pentagrams, fog, crystal balls.
- Anything that reads as a generic startup landing page.
- Anything that makes the practitioner look like a hobbyist rather than someone charging
  ₹4,800 for ninety minutes.
