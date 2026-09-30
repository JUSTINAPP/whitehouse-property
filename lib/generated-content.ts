import { getSupabaseBrowserClient } from "./supabase/client";
import { VenueSlug } from "./types";

export type ContentType = "grid" | "carousel" | "reel" | "story";

export interface GeneratedContentRow {
  id: string;
  venue_slug: VenueSlug;
  content_type: ContentType;
  title: string | null;
  caption: string | null;
  storage_path: string;
  mime_type: string;
  source_note: string | null;
  created_at: string;
}

export function generatedContentPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/generated-content/${storagePath}`;
}

export async function fetchGeneratedContent(venueSlug: VenueSlug): Promise<GeneratedContentRow[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];

  const { data, error } = await client
    .from("generated_content")
    .select("*")
    .eq("venue_slug", venueSlug)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load generated content:", error.message);
    return [];
  }
  return data as GeneratedContentRow[];
}
