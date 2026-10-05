import type { VenueSlug } from "@/lib/types";
import type { PieceDef, PrintPieceDoc } from "./types";
import { TILBURY_SEEDS } from "./seeds/tilbury";

// Which printed pieces each venue has, and the real production geometry of
// each, read straight off the venue's print-ready PDFs. A venue with no
// entry simply has no print menus set up yet.

const TILBURY_DINING: PieceDef = {
  key: "dining",
  label: "Dining Room menu",
  description: "A4 · cover + menu page",
  format: { mediaW: 637.276, mediaH: 883.89, trim: { x0: 21, y0: 21, x1: 616.276, y1: 862.89 }, margin: 30, baseSize: 8.6, separator: "" },
};

const TILBURY_DESSERT: PieceDef = {
  key: "dessert",
  label: "Dessert menu",
  description: "A5 · single page",
  format: { mediaW: 419.25, mediaH: 595.5, trim: { x0: 0, y0: 0, x1: 419.25, y1: 595.5 }, margin: 36, baseSize: 10.6, separator: "|", inkColor: "#41532F", titleColor: "#2F4A24" },
};

const TILBURY_SET: PieceDef = {
  key: "set",
  label: "Shared Set Menu",
  description: "A4 · groups of 10+ · menu + back page",
  format: { mediaW: 595.5, mediaH: 842.25, trim: { x0: 0, y0: 0, x1: 595.5, y1: 842.25 }, margin: 42, baseSize: 10, separator: "|", titleColor: "#3D5A29" },
};

const TILBURY_BAR: PieceDef = {
  key: "bar",
  label: "Bar booklet",
  description: "A5 · 8-page booklet",
  format: { mediaW: 462.945, mediaH: 637.276, trim: { x0: 21, y0: 21, x1: 441.945, y1: 616.276 }, margin: 24, baseSize: 6.6, separator: "" },
};

export const VENUE_PIECES: Partial<Record<VenueSlug, PieceDef[]>> = {
  tilbury: [TILBURY_DINING, TILBURY_BAR, TILBURY_SET, TILBURY_DESSERT],
};

// The starting content for each piece, used until a venue saves its own
// version to the database.
export const PIECE_SEEDS: Partial<Record<VenueSlug, Record<string, PrintPieceDoc>>> = {
  tilbury: TILBURY_SEEDS,
};

export function getPieceDef(venue: VenueSlug, pieceKey: string): PieceDef | undefined {
  return VENUE_PIECES[venue]?.find((p) => p.key === pieceKey);
}
