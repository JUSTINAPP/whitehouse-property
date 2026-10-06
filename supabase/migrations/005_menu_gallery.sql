-- Shot list & gallery photos for the Menu section. A dish's square on the
-- shot list fills the moment a row exists here for its item_key.
create table if not exists menu_gallery_photos (
  id uuid primary key default gen_random_uuid(),
  venue_slug text not null,
  category text not null check (category in ('item', 'featured')),
  item_key text,
  item_name text,
  featured_type text check (featured_type in ('groups', 'drinks', 'atmosphere', 'other')),
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists menu_gallery_photos_venue_idx on menu_gallery_photos (venue_slug, created_at desc);

alter table menu_gallery_photos disable row level security;

-- Public bucket for the uploaded images.
insert into storage.buckets (id, name, public)
values ('menu-gallery-photos', 'menu-gallery-photos', true)
on conflict (id) do nothing;

drop policy if exists "menu gallery photos public read" on storage.objects;
create policy "menu gallery photos public read" on storage.objects for select using (bucket_id = 'menu-gallery-photos');
drop policy if exists "menu gallery photos upload" on storage.objects;
create policy "menu gallery photos upload" on storage.objects for insert with check (bucket_id = 'menu-gallery-photos');
drop policy if exists "menu gallery photos delete" on storage.objects;
create policy "menu gallery photos delete" on storage.objects for delete using (bucket_id = 'menu-gallery-photos');
