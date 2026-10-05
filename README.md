# Whitehouse Property Group Dashboard

A demo operations dashboard built for a sales pitch to Whitehouse Property
Group, covering their four venues: Beach Road Hotel, Barrys Hotel, The
Tilbury, and The Vicar.

This is a duplicate of the real VSB Group Dashboard, rebranded for
Whitehouse's venues with realistic dummy data and live AI-generated
insights. There is no live SevenRooms, Google Analytics, or Search Console
connection here — this is a sales demo, not a production integration.

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS v4)
- Supabase (Postgres + Auth) for the Guest CRM and dashboard logins
- Anthropic API for live AI insights (Overview + Guest CRM pages)
- Recharts for charts
- Lucide React for icons

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's real vs. mock

- **Guest CRM** (`/guests`) is backed by a real Supabase project, seeded
  once with realistic synthetic guest data (22 guests per venue, with
  visit history, spend, VIP flags, and highlights). This is genuinely live
  — sorting, filtering, staff notes, and highlight edits all read/write
  the database.
- **Reservations, Overview covers, Social, Functions, and Marketing** pages
  run on deterministic mock data generators (`lib/mock/*.ts`) rather than
  a live SevenRooms/GA4/Search Console connection, since none exist for a
  prospective client yet. The UI presents this as "live" (no "coming soon"
  banners) so the demo reads naturally.
- **AI insights** (the "Get AI insights" buttons on Overview and Guest CRM)
  are genuinely live calls to the Anthropic API, grounded in the data
  above — not pre-written text.

## Print menus

`/social/menu/print` edits each venue's **printed** menus and downloads
print-ready PDFs. Venues print very different things (different sizes,
page counts, artwork), so print menus are set up **one venue at a time**:

- `lib/menu-print/pieces.ts` lists each venue's printed pieces and their
  real production geometry (read off the venue's print PDFs).
- `lib/menu-print/seeds/<venue>.ts` holds each piece's starting content.
  Until a piece is saved, the editor shows this; Save writes it to the
  `menu_print_docs` table (`supabase/migrations/004_menu_print_docs.sql`).
- Page artwork lives in `public/assets/menu-print/<venue>/<piece>/`.
- The live preview is the real PDF, built by `app/api/menu-print/pdf`.
  Text is drawn as outlined vector paths from the Brown Pro fonts in
  `assets/fonts/brown-pro` (placeholder typeface for now) -- no font is
  embedded in the PDF.

The Tilbury (Dining Room, Bar booklet, Shared Set Menu, Dessert) is set
up. The other venues show a "not set up yet" note until their menus are
added.

## Logins

Two logins are expected: `jonas@dorja.com` and `scott@whpgroup.com.au`.
Supabase Auth users can't be created via this session's tools — create
them manually:

1. Go to the Supabase Dashboard for this project (`hylartcppunjhpijqnkw`)
   → Authentication → Users → Add user.
2. Add both emails with a password of your choice (or send a magic link).

## Environment variables

See `.env.local.example`. `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are already filled in `.env.local` for the
project created for this demo. You still need to supply:

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Project Settings → API
- `ANTHROPIC_API_KEY` — needed for the AI insights buttons to work

Add the same four variables in Vercel (Project Settings → Environment
Variables) before deploying.

## Deploying

```bash
git push origin main
```

then import the repo into Vercel and add the environment variables above.
