import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { VenueSlug } from "@/lib/types";
import { resolveVenueId } from "./social-posts-data";

export interface ContentPillar {
  id: string;
  venueId: VenueSlug;
  title: string;
  description: string | null;
  position: number;
}

export type IdeaSource = "ai" | "manual";

export interface ContentIdea {
  id: string;
  pillarId: string;
  venueId: VenueSlug;
  body: string;
  source: IdeaSource;
  position: number;
}

interface PillarRow {
  id: string;
  title: string;
  description: string | null;
  position: number;
}
interface IdeaRow {
  id: string;
  pillar_id: string;
  body: string;
  source: string;
  position: number;
}

/**
 * Loads this venue's full Ideas board — pillars plus every idea under them —
 * in two queries. Returns null (not []) when Supabase isn't reachable, so
 * the page can tell "not configured yet" apart from "no pillars generated
 * yet" and show the right empty state.
 */
export async function fetchIdeasBoard(
  venueSlug: VenueSlug
): Promise<{ pillars: ContentPillar[]; ideas: ContentIdea[] } | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venueId = await resolveVenueId(venueSlug);
  if (!venueId) return null;

  const { data: pillarRows, error: pillarError } = await client
    .from("content_pillars")
    .select("id, title, description, position")
    .eq("venue_id", venueId)
    .order("position", { ascending: true });

  if (pillarError) {
    console.error("Failed to load content pillars:", pillarError.message);
    return null;
  }

  const pillars: ContentPillar[] = (pillarRows as PillarRow[]).map((r) => ({
    id: r.id,
    venueId: venueSlug,
    title: r.title,
    description: r.description,
    position: r.position,
  }));

  if (pillars.length === 0) {
    return { pillars: [], ideas: [] };
  }

  const { data: ideaRows, error: ideaError } = await client
    .from("content_ideas")
    .select("id, pillar_id, body, source, position")
    .eq("venue_id", venueId)
    .order("position", { ascending: true });

  if (ideaError) {
    console.error("Failed to load content ideas:", ideaError.message);
    return null;
  }

  const ideas: ContentIdea[] = (ideaRows as IdeaRow[]).map((r) => ({
    id: r.id,
    pillarId: r.pillar_id,
    venueId: venueSlug,
    body: r.body,
    source: r.source as IdeaSource,
    position: r.position,
  }));

  return { pillars, ideas };
}

/**
 * Replaces the venue's entire pillar set (and every idea under it) with a
 * freshly generated set. Used for the first "Generate Ideas" run and for
 * "Regenerate pillars" — both are a clean slate, matching Later's flow
 * where pillars are the starting point you then build ideas on top of.
 */
export async function replacePillars(
  venueSlug: VenueSlug,
  pillars: { title: string; description: string }[]
): Promise<ContentPillar[] | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venueId = await resolveVenueId(venueSlug);
  if (!venueId) return null;

  const { error: deleteError } = await client.from("content_pillars").delete().eq("venue_id", venueId);
  if (deleteError) {
    console.error("Failed to clear existing pillars:", deleteError.message);
    return null;
  }

  const { data, error } = await client
    .from("content_pillars")
    .insert(pillars.map((p, i) => ({ venue_id: venueId, title: p.title, description: p.description, position: i })))
    .select("id, title, description, position");

  if (error) {
    console.error("Failed to save content pillars:", error.message);
    return null;
  }

  return (data as PillarRow[]).map((r) => ({
    id: r.id,
    venueId: venueSlug,
    title: r.title,
    description: r.description,
    position: r.position,
  }));
}

export async function addPillar(venueSlug: VenueSlug, title: string, position: number): Promise<ContentPillar | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venueId = await resolveVenueId(venueSlug);
  if (!venueId) return null;

  const { data, error } = await client
    .from("content_pillars")
    .insert({ venue_id: venueId, title, description: null, position })
    .select("id, title, description, position")
    .single();

  if (error) {
    console.error("Failed to add pillar:", error.message);
    return null;
  }
  return { id: data.id, venueId: venueSlug, title: data.title, description: data.description, position: data.position };
}

export async function renamePillar(pillarId: string, title: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client.from("content_pillars").update({ title }).eq("id", pillarId);
  if (error) {
    console.error("Failed to rename pillar:", error.message);
    return false;
  }
  return true;
}

export async function deletePillar(pillarId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client.from("content_pillars").delete().eq("id", pillarId);
  if (error) {
    console.error("Failed to delete pillar:", error.message);
    return false;
  }
  return true;
}

export async function addIdea(
  venueSlug: VenueSlug,
  pillarId: string,
  body: string,
  source: IdeaSource,
  position: number
): Promise<ContentIdea | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const venueId = await resolveVenueId(venueSlug);
  if (!venueId) return null;

  const { data, error } = await client
    .from("content_ideas")
    .insert({ venue_id: venueId, pillar_id: pillarId, body, source, position })
    .select("id, pillar_id, body, source, position")
    .single();

  if (error) {
    console.error("Failed to add idea:", error.message);
    return null;
  }
  return {
    id: data.id,
    pillarId: data.pillar_id,
    venueId: venueSlug,
    body: data.body,
    source: data.source as IdeaSource,
    position: data.position,
  };
}

export async function deleteIdea(ideaId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client.from("content_ideas").delete().eq("id", ideaId);
  if (error) {
    console.error("Failed to delete idea:", error.message);
    return false;
  }
  return true;
}
