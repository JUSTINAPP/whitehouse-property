-- Cache for AI-generated posting suggestions (/api/social/suggestions).
-- One row per venue; the route treats a row as fresh for 24h and also
-- invalidates it when the displayed week has rolled over, so day-of-week
-- labels ("Mon"/"Tue"/...) always line up with the calendar currently shown.
create table if not exists social_suggestions_cache (
  venue_slug text primary key,
  week_start date not null,
  suggestions jsonb not null,
  generated_at timestamptz not null default now()
);
