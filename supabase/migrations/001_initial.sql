-- VSB Group Dashboard — initial schema
-- Do NOT run until Supabase credentials are confirmed and connected.

create table venues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  accent_color text,
  created_at timestamptz default now()
);

create table social_posts (
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

create table guests (
  id uuid default gen_random_uuid() primary key,
  venue_id uuid references venues(id),
  name text not null,
  email text,
  phone text,
  visit_count integer default 0,
  last_visit date,
  total_spend numeric,
  tags text[],
  notes text,
  created_at timestamptz default now()
);

create table reservations (
  id uuid default gen_random_uuid() primary key,
  venue_id uuid references venues(id),
  guest_name text not null,
  guest_email text,
  party_size integer,
  reservation_date date,
  reservation_time time,
  table_number text,
  status text default 'confirmed',
  special_notes text,
  created_at timestamptz default now()
);

create index social_posts_venue_id_idx on social_posts(venue_id);
create index guests_venue_id_idx on guests(venue_id);
create index reservations_venue_id_idx on reservations(venue_id);
create index reservations_date_idx on reservations(reservation_date);
