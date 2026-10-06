import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { VenueSlug } from "@/lib/types";

// The shot list is "auto-detected": it's never manually marked done/needed.
// An item's square is filled the moment a photo row exists for its item_key
// in this table, and empty otherwise -- the gap is always derived live from
// the real menu content (see app/menu/gallery/page.tsx), not tracked
// separately. "item" rows are tied to one menu item (item_key set);
// "featured" rows are the hero shots (groups/drinks/atmosphere/other) that
// sit at the top of the gallery regardless of any one dish.
export type GalleryCategory = "item" | "featured";
export type FeaturedType = "groups" | "drinks" | "atmosphere" | "other";

export interface GalleryPhoto {
  id: string;
  venueSlug: VenueSlug;
  category: GalleryCategory;
  itemKey?: string;
  itemName?: string;
  featuredType?: FeaturedType;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

interface GalleryPhotoRow {
  id: string;
  venue_slug: string;
  category: GalleryCategory;
  item_key: string | null;
  item_name: string | null;
  featured_type: FeaturedType | null;
  image_url: string;
  caption: string | null;
  created_at: string;
}

function fromRow(row: GalleryPhotoRow): GalleryPhoto {
  return {
    id: row.id,
    venueSlug: row.venue_slug as VenueSlug,
    category: row.category,
    itemKey: row.item_key ?? undefined,
    itemName: row.item_name ?? undefined,
    featuredType: row.featured_type ?? undefined,
    imageUrl: row.image_url,
    caption: row.caption ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchGalleryPhotos(venueSlug: VenueSlug): Promise<GalleryPhoto[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];

  const { data, error } = await client
    .from("menu_gallery_photos")
    .select("*")
    .eq("venue_slug", venueSlug)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as GalleryPhotoRow[]).map(fromRow);
}

const GALLERY_BUCKET = "menu-gallery-photos";
export const MAX_GALLERY_IMAGE_BYTES = 8 * 1024 * 1024;

export interface GalleryUploadResult {
  ok: boolean;
  photo?: GalleryPhoto;
  error?: string;
}

export async function uploadGalleryPhoto(
  file: File,
  venueSlug: VenueSlug,
  opts: { category: "item"; itemKey: string; itemName: string } | { category: "featured"; featuredType: FeaturedType; caption?: string }
): Promise<GalleryUploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (file.size > MAX_GALLERY_IMAGE_BYTES) {
    return { ok: false, error: `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the cap is 8MB.` };
  }

  const client = getSupabaseBrowserClient();
  if (!client) {
    return { ok: false, error: "Supabase isn't configured in this environment yet, so uploads can't be saved." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${venueSlug}/${opts.category}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await client.storage.from(GALLERY_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) {
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = client.storage.from(GALLERY_BUCKET).getPublicUrl(path);

  const insertRow: {
    venue_slug: VenueSlug;
    category: GalleryCategory;
    image_url: string;
    item_key?: string;
    item_name?: string;
    featured_type?: FeaturedType;
    caption?: string;
  } =
    opts.category === "item"
      ? { venue_slug: venueSlug, category: "item", item_key: opts.itemKey, item_name: opts.itemName, image_url: urlData.publicUrl }
      : { venue_slug: venueSlug, category: "featured", featured_type: opts.featuredType, caption: opts.caption, image_url: urlData.publicUrl };

  const { data, error } = await client.from("menu_gallery_photos").insert(insertRow).select("*").single();
  if (error || !data) {
    return { ok: false, error: `Saved the image but couldn't record it: ${error?.message ?? "unknown error"}` };
  }

  return { ok: true, photo: fromRow(data as GalleryPhotoRow) };
}

export async function deleteGalleryPhoto(id: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;
  const { error } = await client.from("menu_gallery_photos").delete().eq("id", id);
  return !error;
}
