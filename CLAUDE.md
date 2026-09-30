@AGENTS.md

## Auto-deploy instructions
After every change or set of changes, always run:
git add .
git commit -m "[descriptive message of what changed]"
git push origin main

Never wait for me to ask. Always push after confirming changes are complete.

## What this project is

A sales-demo duplicate of the VSB Group Dashboard, rebranded for Whitehouse
Property Group's four venues (Beach Road Hotel, Barrys Hotel, The Tilbury,
The Vicar). No live SevenRooms/GA4/Search Console integration exists —
Reservations/Overview/Social/Functions/Marketing run on deterministic mock
data (`lib/mock/*.ts`); the Guest CRM is a real, separately-seeded Supabase
project (`hylartcppunjhpijqnkw`). See README.md for the full breakdown of
what's real vs. mock, and how to set up logins and env vars.
