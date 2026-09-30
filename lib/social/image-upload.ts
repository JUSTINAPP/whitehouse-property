import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { VenueSlug } from "@/lib/types";

// Vercel's serverless request body limit is ~4.5MB — this dashboard's own
// upload flow goes straight from the browser to Supabase Storage (never
// through a Next.js route), but images are still capped at 4MB so a single
// post's asset stays well under that ceiling if it's ever proxied through a
// function later (e.g. a resize step).
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const BUCKET = "social-posts";

export interface ImageUploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

export async function uploadPostImage(file: File, venueSlug: VenueSlug): Promise<ImageUploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the cap is 4MB.` };
  }

  const client = getSupabaseBrowserClient();
  if (!client) {
    return { ok: false, error: "Supabase isn't configured in this environment yet, so uploads can't be saved." };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${venueSlug}/${crypto.randomUUID()}.${ext}`;

  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });

  if (error) {
    return { ok: false, error: `Upload failed: ${error.message}` };
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
