-- Print menus. One row per printed piece (e.g. The Tilbury's "dining" A4 menu
-- or its "bar" A5 booklet), keyed by venue slug + piece key. "content" holds
-- the whole piece: version plus an ordered list of pages, each with its own
-- background artwork and sections of items (see lib/menu-print/types.ts).
-- Until a piece has a row here the dashboard shows the venue's built-in
-- starting content (lib/menu-print/seeds); the first Save creates the row.
-- RLS is off, same as the other tables in this project.
create table if not exists menu_print_docs (
  venue_slug text not null,
  piece_key text not null,
  content jsonb not null,
  updated_at timestamptz default now(),
  primary key (venue_slug, piece_key)
);
