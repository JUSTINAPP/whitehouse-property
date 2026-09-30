import { PostFormat, VenueSlug } from "@/lib/types";

export const SUGGESTION_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface PostingSuggestion {
  day: (typeof SUGGESTION_DAY_LABELS)[number];
  time: string; // HH:MM
  contentType: PostFormat;
  contentSuggestion: string;
  reason: string;
}

export interface SuggestionsResponse {
  suggestions: PostingSuggestion[];
  strategy: string;
  generatedAt: string;
  cached: boolean;
}

export async function fetchPostingSuggestions(
  venueSlug: VenueSlug,
  options?: { force?: boolean }
): Promise<SuggestionsResponse> {
  const params = new URLSearchParams({ venue: venueSlug });
  if (options?.force) params.set("force", "1");

  const res = await fetch(`/api/social/suggestions?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to load suggestions (${res.status})`);
  }
  return res.json();
}
