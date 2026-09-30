import { HighlightType } from "@/lib/types";

// "allergy" is deliberately the odd one out here -- rose/red everywhere,
// since it's a safety flag rather than a preference and needs to be
// impossible to miss at a glance.
export const HIGHLIGHT_TYPE_LABELS: Record<HighlightType, string> = {
  allergy: "Allergy",
  seating: "Seating",
  occasion: "Occasion",
  service: "Service note",
  other: "Note",
};

export const HIGHLIGHT_TYPE_BADGE: Record<HighlightType, "cancelled" | "gold" | "pending" | "neutral"> = {
  allergy: "cancelled",
  seating: "neutral",
  occasion: "gold",
  service: "pending",
  other: "neutral",
};

export const HIGHLIGHT_TYPES: HighlightType[] = ["allergy", "seating", "occasion", "service", "other"];
