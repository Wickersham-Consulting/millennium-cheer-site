import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Display date or "season" line, e.g. "Summer 2026" or "January 24, 2026".
      when: z.string(),
      // ISO date used for sorting (most recent or upcoming first).
      sortDate: z.coerce.date(),
      // Optional last day the event is relevant. /events hides an event once
      // (endsOn ?? sortDate) is in the past — so single-day events auto-archive
      // while multi-week ones (e.g. summer clinics) stay until they truly end.
      endsOn: z.coerce.date().optional(),
      location: z.string().optional(),
      partner: z.string().optional(),
      // Show this event on the /events page (fundraisers + notable team
      // happenings). Without it, an event is calendar-only.
      featured: z.boolean().default(false),
      paymentLink: z.string().url().optional(),
      // True when a payment/ticket link is expected but not ready — renders a
      // greyed "coming soon" button. Flip to false once paymentLink is set.
      paymentPending: z.boolean().default(false),
      // Button text for the call-to-action (e.g. "Buy Tickets", "Sign Up").
      ctaLabel: z.string().optional(),
      flyer: image().optional(),
      summary: z.string(),
      published: z.boolean().default(true),
    }),
});

const announcements = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/announcements" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    contactEmail: z.string().email().optional(),
    deadline: z.coerce.date().optional(),
    // Optional Zoom URL when the announcement is about a meeting (e.g. an
    // election that takes place at the next booster meeting). Renders as a
    // 'Join via Zoom' button on the announcement card.
    zoomLink: z.string().url().optional(),
    // Optional call-to-action link (e.g. a Google Form to fill out). Renders as
    // a primary button on the announcement card; linkLabel sets the button text.
    link: z.string().url().optional(),
    linkLabel: z.string().optional(),
    // When true, the CTA renders greyed-out and non-clickable ("— coming soon")
    // — for a link that isn't ready yet (e.g. a Square payment link still TBD).
    // Set the real link and flip this to false to make it live.
    linkPending: z.boolean().default(false),
    published: z.boolean().default(true),
  }),
});

const achievements = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/achievements" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Year or season label shown on the card.
      season: z.string(),
      // ISO date for sorting.
      date: z.coerce.date(),
      photo: image(),
      photoAlt: z.string(),
      summary: z.string().optional(),
      published: z.boolean().default(true),
    }),
});

// Photo gallery shown on the homepage ("On the Sidelines"). Images are
// uploaded via the CMS into src/assets/gallery and ordered newest-first by
// date. This is the swappable photo surface for the yearly site refresh.
const gallery = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/gallery" }),
  schema: ({ image }) =>
    z.object({
      image: image(),
      alt: z.string(),
      caption: z.string().optional(),
      // ISO date used to order photos (newest first).
      date: z.coerce.date(),
      published: z.boolean().default(true),
    }),
});

// Post-payment "thank you" pages used as Square Payment Link redirect
// targets. Each entry corresponds to a /thanks/<slug> route. The slug is
// the markdown filename, e.g. donate.md -> /thanks/donate.
const thanks = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/thanks" }),
  schema: z.object({
    title: z.string(),
    headline: z.string(),
    summary: z.string().optional(),
    nextSteps: z.array(z.string()).optional(),
    showLogoUploadCTA: z.boolean().default(false),
    primaryCTA: z
      .object({
        label: z.string(),
        href: z.string(),
      })
      .optional(),
  }),
});

// Current sponsors shown on the /sponsorship "Thank You to Our Sponsors" wall.
// Public-safe fields only — business name, logo, optional website. No amounts,
// contacts, or referring-family info ever live here. CMS-editable so sponsors
// can be added each season.
const sponsors = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/sponsors" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image().optional(),
      url: z.string().url().optional(),
      // Lower number sorts first; ties fall back to name.
      order: z.number().default(0),
      published: z.boolean().default(true),
    }),
});

// Season competition schedule — highlighted on the homepage. Sorted by date.
const competitions = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/competitions" }),
  schema: z.object({
    title: z.string(),
    // ISO date for sorting.
    date: z.coerce.date(),
    // Human display of the date, e.g. "Nov 7" or "Jan 14–16".
    dateLabel: z.string(),
    // Which squads compete, e.g. "JV & Varsity" or "All Girl Stunt".
    teams: z.string().optional(),
    location: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

// Booster meeting minutes. The PDF lives in public/downloads/minutes/ and
// is referenced by `pdf` (path relative to /). One markdown entry per
// meeting; the filename slug is unused — entries are sorted by `date`.
const minutes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/minutes" }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
    pdf: z.string(),
    summary: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

// Master list of active Square/payment links, shown on /parent-info under
// "Make a Payment". Mirrors the booster club's Google Doc of QR codes — add
// an entry here as a fundraiser opens, unpublish (or delete) once it closes.
const paymentLinks = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/payment-links" }),
  schema: z.object({
    title: z.string(),
    link: z.string().url().optional(),
    // True when a link is expected but not ready yet — renders a greyed
    // "coming soon" button. Flip to false once `link` is set.
    linkPending: z.boolean().default(false),
    note: z.string().optional(),
    // Manual sort order, lowest first.
    order: z.number().default(0),
    published: z.boolean().default(true),
  }),
});

export const collections = { events, announcements, achievements, thanks, minutes, gallery, sponsors, competitions, paymentLinks };
