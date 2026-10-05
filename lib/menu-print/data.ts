import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VenueSlug } from "@/lib/types";
import { PIECE_SEEDS } from "./pieces";
import type { PrintPieceDoc } from "./types";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export interface LoadedPiece {
  doc: PrintPieceDoc;
  // false while the piece is still showing the built-in starting content
  // (nothing saved to the database yet).
  saved: boolean;
}

/**
 * Loads a piece's content: the saved version if there is one, otherwise a
 * fresh copy of the venue's built-in starting content.
 */
export async function fetchPieceDoc(venue: VenueSlug, pieceKey: string): Promise<LoadedPiece | null> {
  const seed = PIECE_SEEDS[venue]?.[pieceKey];
  const client = getSupabaseBrowserClient();
  if (client) {
    const { data } = await client.from("menu_print_docs").select("content").eq("venue_slug", venue).eq("piece_key", pieceKey).maybeSingle();
    if (data?.content) return { doc: data.content as PrintPieceDoc, saved: true };
  }
  return seed ? { doc: clone(seed), saved: false } : null;
}

export async function savePieceDoc(venue: VenueSlug, pieceKey: string, doc: PrintPieceDoc): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;
  const { error } = await client
    .from("menu_print_docs")
    .upsert({ venue_slug: venue, piece_key: pieceKey, content: doc, updated_at: new Date().toISOString() }, { onConflict: "venue_slug,piece_key" });
  return !error;
}

export function getSeedDoc(venue: VenueSlug, pieceKey: string): PrintPieceDoc | null {
  const seed = PIECE_SEEDS[venue]?.[pieceKey];
  return seed ? clone(seed) : null;
}
