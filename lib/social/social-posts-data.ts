import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getVenue } from "@/lib/venues";
import type { PostDraft } from "@/components/social/post-modal";
import { SocialPost, VenueSlug } from "@/lib/types";

// social_posts.venue_id is a uuid FK to venues(id), but the app only ever
// carries a venue *slug* (see VenueProvider). This resolves — and lazily
// creates — the venues row for a slug, so callers never have to think about
// uuids. Cached per browser session since venue rows never change shape.
const venueIdCache = new Map<VenueSlug, string>();

export async function resolveVenueId(slug: VenueSlug): Promise<string | null> {
  const cached = venueIdCache.get(slug);
  if (cached) return cached;

  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venue = getVenue(slug);
  const { data, error } = await client
    .from("venues")
    .upsert({ slug, name: venue.name }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to resolve venue row:", error?.message);
    return null;
  }
  venueIdCache.set(slug, data.id as string);
  return data.id as string;
}

interface SocialPostRow {
  id: string;
  venue_id: string;
  channel: string;
  format: string | null;
  title: string | null;
  caption: string | null;
  content_brief: string | null;
  scheduled_date: string;
  scheduled_time: string;
  image_url: string | null;
  video_url: string | null;
  status: string;
  likes: number | null;
  comments: number | null;
  reach: number | null;
}

function rowToPost(row: SocialPostRow, venueSlug: VenueSlug): SocialPost {
  return {
    id: row.id,
    venueId: venueSlug,
    channel: row.channel as SocialPost["channel"],
    format: (row.format as SocialPost["format"]) ?? undefined,
    title: row.title ?? "",
    caption: row.caption ?? "",
    contentBrief: row.content_brief,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time?.slice(0, 5) ?? "00:00",
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    status: row.status as SocialPost["status"],
    likes: row.likes ?? undefined,
    comments: row.comments ?? undefined,
    reach: row.reach ?? undefined,
  };
}

function draftToRow(draft: PostDraft, venueId: string) {
  return {
    venue_id: venueId,
    channel: draft.channel,
    format: draft.format ?? null,
    title: draft.title,
    caption: draft.caption,
    content_brief: draft.contentBrief || null,
    scheduled_date: draft.scheduledDate,
    scheduled_time: draft.scheduledTime,
    image_url: draft.imageUrl,
    video_url: draft.videoUrl ?? null,
    status: draft.status,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Loads this venue's posts from Supabase. Returns `null` (rather than []) when
 * Supabase isn't configured or the table can't be reached yet, so callers can
 * tell "no live data available" apart from "genuinely zero posts" and fall
 * back to mock content instead of showing an empty calendar.
 */
export async function fetchSocialPosts(venueSlug: VenueSlug): Promise<SocialPost[] | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venueId = await resolveVenueId(venueSlug);
  if (!venueId) return null;

  const { data, error } = await client
    .from("social_posts")
    .select("*")
    .eq("venue_id", venueId)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });

  if (error) {
    console.error("Failed to load social posts:", error.message);
    return null;
  }
  return (data as SocialPostRow[]).map((row) => rowToPost(row, venueSlug));
}

export async function createSocialPost(venueSlug: VenueSlug, draft: PostDraft): Promise<SocialPost | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venueId = await resolveVenueId(venueSlug);
  if (!venueId) return null;

  const { data, error } = await client
    .from("social_posts")
    .insert(draftToRow(draft, venueId))
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create social post:", error.message);
    return null;
  }
  return rowToPost(data as SocialPostRow, venueSlug);
}

export async function updateSocialPost(id: string, venueSlug: VenueSlug, draft: PostDraft): Promise<SocialPost | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venueId = await resolveVenueId(venueSlug);
  if (!venueId) return null;

  const { data, error } = await client
    .from("social_posts")
    .update(draftToRow(draft, venueId))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update social post:", error.message);
    return null;
  }
  return rowToPost(data as SocialPostRow, venueSlug);
}

export async function deleteSocialPost(id: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client.from("social_posts").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete social post:", error.message);
    return false;
  }
  return true;
}
