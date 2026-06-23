# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**millenniumcheer.com** — the Millennium High School Cheer Booster Club site. Astro 6 + Tailwind 4, hosted on **AWS S3 + CloudFront**. Repo: `Wickersham-Consulting/millennium-cheer-site`.

**Why it's built the way it is:** 2026–27 is the current maintainer's last year on the booster club. A core goal is that **non-technical parents can update the site themselves** via the CMS at `/admin` after the handoff. So: favor CMS-editable content collections over hardcoded values, and self-maintaining patterns (auto-archiving, daily rebuilds) over anything that needs a developer.

## Commands

```sh
npm install
npm run dev        # local dev at http://localhost:4321
npm run build      # production build → dist/
```
Node ≥ 22.12. No test suite; verify by building + checking the page.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds and syncs `dist/` to S3 + invalidates CloudFront on **every push to `main`**, plus a **daily scheduled rebuild** (cron) so date-based content refreshes without a commit. Push to `main` = deploy. There is no staging branch.

## CMS (content editing)

- **Sveltia CMS** at `/admin` (a Decap-compatible, maintained replacement — we migrated off Netlify git-gateway, which Meta… er, Netlify deprecated).
- **Auth: GitHub OAuth via a Cloudflare Worker** (`sveltia-cms-auth` at `https://sveltia-cms-auth.cwickersham.workers.dev`). The GitHub OAuth App is org-owned; its **client ID/secret live in the worker's _runtime_ Variables and Secrets** (not Build) — if login ever returns `MISCONFIGURED_CLIENT`, that's the secrets missing/not-deployed at runtime.
- **Editors must be GitHub _Outside Collaborators_ (Write) on this repo** — never org members (keeps the rest of the org private). Account-wide `repo` scope is normal for this OAuth style; org-level access restrictions are what actually bound it.
- Publishing **commits straight to `main`** (simple mode — no editorial workflow), which triggers deploy. The repo is the single source of truth; no database, so no drift. To add a review/PR step later, set `publish_mode: editorial_workflow` in `public/admin/config.yml`.
- Config + collections: `public/admin/config.yml`. Collections: events, announcements, achievements, gallery, sponsors, competitions, minutes, thanks. Content lives in `src/content/<collection>/*.md`; images in `src/assets/`.

## Content patterns worth knowing (reuse these)

- **Calendar (`/calendar`)** auto-syncs from the coaches' **SportsYou `.ics` feed** at build (`src/lib/sportsyou.ts`); feed URL is the repo secret `SPORTSYOU_ICS_URL`, with a committed snapshot fallback. Routine practices render de-emphasized.
- **Events (`/events`)** shows entries flagged `featured` and **auto-archives** past ones via `(endsOn ?? sortDate) >= today` (Arizona time), re-checked each build. Calendar-only schedule items are not featured.
- **Pending links** render a greyed "— coming soon" button until ready: `paymentPending` on events, `linkPending` on announcements. Flip the flag + add the link to go live.
- **Sponsors** (`/sponsorship` wall) — public-safe fields only (name, logo, optional URL). Never put dollar amounts, contacts, or athlete/family names in the repo.
- **Gallery** ("On the Sidelines" on the homepage) is a **curated** photo collection (NOT a live Instagram feed — see roadmap).
- Dates: content dates are stored at UTC midnight; format/compare in `America/Phoenix` (no DST) to avoid day-shift bugs. `Layout.astro` takes a `noindex` prop for draft pages.

## Unlinked preview pages (not in nav, `noindex`)

- `/fundraising-poc` — 3 fundraising-thermometer concepts for the board to pick from (goal **$18,900**).
- `/shop-preview` — Spirit Wear shop mockup (vendor brochure) + Instagram feed stub.

## Roadmap / open items

**Pending links to flip live** (set the link, untick the pending flag):
- NASCAR ticket fundraiser (10/17) and Cardinals ticket fundraiser (11/29) — `paymentPending` events.
- Senior Photos $60 (announcement `2026-season-photos.md`) — `linkPending`.

**Instagram live feed** — the homepage gallery is curated, not live. To make it live: switch `@millennium_cheer` to a **professional (Creator recommended)** account + connect, then wire a feed widget (e.g. Behold) into the homepage. Mockup at `/shop-preview`.

**Spirit Wear shop** — make the `/shop-preview` mockup real: get the vendor's order URL(s) + final designs/pricing, build a **CMS-editable `products` collection**, and add a `/shop` nav page. Model: brochure → vendor handles checkout/fulfillment; booster earns $5/order.

**Fundraising thermometer** — board picks a concept at `/fundraising-poc`, then build the real version with a CMS-editable "raised" amount.

**Smaller:** add the June 20 car-wash photos to the gallery; consider auto-archiving announcements (like events); a "Season Fundraisers" overview for tentative ones (Aug school fundraiser, Applebee's 10/31, Trunk-or-Treat, Dec mini-clinic, Casino Night); wire hero/coach photos to the CMS; bump the deploy workflow off the deprecated Node 20 actions.
