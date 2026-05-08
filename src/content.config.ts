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
      location: z.string().optional(),
      partner: z.string().optional(),
      paymentLink: z.string().url().optional(),
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

export const collections = { events, announcements, achievements, thanks };
