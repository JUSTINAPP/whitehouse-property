-- Social calendar enhancements: content brief, post format/video support,
-- and per-venue Instagram connection config.
--
-- Written idempotently (IF NOT EXISTS everywhere) so it's safe to run
-- whether or not 001_initial.sql has already been applied.

create table if not exists venues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  accent_color text,
  created_at timestamptz default now()
);

create table if not exists social_posts (
  id uuid default gen_random_uuid() primary key,
  venue_id uuid references venues(id),
  channel text not null,
  title text,
  caption text,
  scheduled_date date,
  scheduled_time time,
  image_url text,
  status text default 'draft',
  created_at timestamptz default now()
);

create index if not exists social_posts_venue_id_idx on social_posts(venue_id);

-- Post type (Photo/Carousel/Reel/Story), externally-hosted video URL for
-- Reels, and the creative-direction brief shown to whoever produces the
-- asset (content managers, AI image generators) — separate from the caption.
alter table social_posts add column if not exists format text;
alter table social_posts add column if not exists video_url text;
alter table social_posts add column if not exists content_brief text;
alter table social_posts add column if not exists updated_at timestamptz default now();

-- Per-venue Instagram connection. The OAuth flow that populates this table
-- is built separately; until then every venue reads back as not connected.
create table if not exists venues_instagram_config (
  id uuid default gen_random_uuid() primary key,
  venue_id uuid references venues(id),
  access_token text,
  instagram_user_id text,
  username text,
  connected_at timestamptz,
  updated_at timestamptz default now()
);

-- Public bucket for post images uploaded from the calendar (capped at 4MB
-- client-side). Videos are never uploaded here — Reels store an externally
-- hosted URL instead (Shopify CDN, Cloudinary, etc).
insert into storage.buckets (id, name, public)
values ('social-posts', 'social-posts', true)
on conflict (id) do nothing;

-- storage.objects has RLS on by default; scope policies to this bucket only
-- (not a blanket allow) so the anon-key browser client can upload/read post
-- images without touching access to any other bucket.
drop policy if exists "social-posts public read" on storage.objects;
create policy "social-posts public read"
on storage.objects for select
using (bucket_id = 'social-posts');

drop policy if exists "social-posts anon upload" on storage.objects;
create policy "social-posts anon upload"
on storage.objects for insert
with check (bucket_id = 'social-posts');
