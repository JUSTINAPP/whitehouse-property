import { getVenue } from "@/lib/venues";
import { VENUE_MENUS } from "@/lib/menu-data";
import { PIECE_SEEDS, VENUE_PIECES } from "@/lib/menu-print/pieces";
import type { PrintPage, PrintPieceDoc, PrintSection } from "@/lib/menu-print/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VenueSlug } from "@/lib/types";

export interface MenuInsightsContext {
  venueName: string;
  venueType: string;
  // Whether this came from the venue's real printed pieces (so Claude can
  // reason about page/column reading order) or just the online menu's
  // document order.
  sourceDescription: string;
  positionalMenuText: string;
}

export type MenuInsightsContextResult =
  | { ok: true; data: MenuInsightsContext }
  | { ok: false; message: string };

function describeSection(section: PrintSection, index: number, count: number): string {
  const position = index === 0 ? "FIRST in this column" : index === count - 1 ? "LAST in this column" : `position ${index + 1} of ${count}`;
  const lines = section.items
    .filter((item) => item.name.trim() || item.description.trim())
    .map((item, i) => {
      const itemPos = i === 0 ? "first item" : i === section.items.length - 1 && section.items.length > 1 ? "last item" : `item ${i + 1}`;
      const detail = [item.description, item.note].filter(Boolean).join(" — ");
      const dietary = item.dietary.length ? ` (${item.dietary.join(", ")})` : "";
      const price = item.price ? ` — $${item.price}` : "";
      return `    - [${itemPos}] ${item.name || detail}${dietary}${price}${item.name && detail ? ` — ${detail}` : ""}`;
    });
  return `  SECTION "${section.title}" (${position})${section.subtitle ? ` — ${section.subtitle.replace(/\n/g, " ")}` : ""}:\n${lines.join("\n")}`;
}

function describePage(page: PrintPage): string {
  if (page.kind === "art") return `PAGE "${page.label}" (artwork only, no items — e.g. a cover or back page)`;
  const cols = page.columns && page.columns.length > 0 ? page.columns.length : 1;
  const parts: string[] = [`PAGE "${page.label}"${cols > 1 ? ` (${cols} columns, read left to right)` : ""}:`];
  for (let c = 0; c < cols; c++) {
    const sections = page.sections.filter((s) => (s.column ?? 0) === c);
    if (sections.length === 0) continue;
    if (cols > 1) parts.push(` COLUMN ${c + 1}:`);
    sections.forEach((s, i) => parts.push(describeSection(s, i, sections.length)));
  }
  return parts.join("\n");
}

async function loadPieceDoc(venue: VenueSlug, pieceKey: string): Promise<PrintPieceDoc | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.from("menu_print_docs").select("content").eq("venue_slug", venue).eq("piece_key", pieceKey).maybeSingle();
    if (data?.content) return data.content as PrintPieceDoc;
  }
  return PIECE_SEEDS[venue]?.[pieceKey] ?? null;
}

/**
 * Builds a plain-text description of the menu's real reading order and
 * prices for the AI menu insights prompts. For venues with print menus this
 * reads each printed piece (the saved version, else the built-in starting
 * content) page by page and column by column; other venues fall back to the
 * online menu's own section order.
 */
export async function gatherMenuInsightsContext(venue: VenueSlug): Promise<MenuInsightsContextResult> {
  const venueInfo = getVenue(venue);
  const pieces = VENUE_PIECES[venue];

  if (pieces && pieces.length > 0) {
    const parts: string[] = [];
    for (const piece of pieces) {
      const doc = await loadPieceDoc(venue, piece.key);
      if (!doc) continue;
      parts.push(`\n=== PRINTED PIECE: ${piece.label} (${piece.description}; version ${doc.version}) ===`);
      for (const page of doc.pages) parts.push(describePage(page));
    }
    if (parts.length > 0) {
      return {
        ok: true,
        data: {
          venueName: venueInfo.name,
          venueType: venueInfo.type,
          sourceDescription: "the venue's real printed menus, in their actual piece/page/column reading order",
          positionalMenuText: parts.join("\n"),
        },
      };
    }
  }

  const onlineMenu = VENUE_MENUS[venue];
  if (!onlineMenu) {
    return { ok: false, message: `No menu on file for ${venueInfo.name} yet.` };
  }

  const parts: string[] = [];
  for (const group of onlineMenu.groups) {
    parts.push(`\n${group.label.toUpperCase()} MENU (as listed, top to bottom):`);
    group.sections.forEach((section, si) => {
      const position = si === 0 ? "FIRST section" : si === group.sections.length - 1 ? "LAST section" : `section ${si + 1} of ${group.sections.length}`;
      const lines = section.items.map((item, i) => {
        const itemPos = i === 0 ? "first item" : i === section.items.length - 1 && section.items.length > 1 ? "last item" : `item ${i + 1}`;
        const price = typeof item.price === "number" ? `$${item.price}` : item.price;
        return `    - [${itemPos}] ${item.name} — ${price}${item.description ? ` — ${item.description}` : ""}`;
      });
      parts.push(`  SECTION "${section.title}" (${position}):\n${lines.join("\n")}`);
    });
  }

  return {
    ok: true,
    data: {
      venueName: venueInfo.name,
      venueType: venueInfo.type,
      sourceDescription: "the online menu page, in its listed document order (no printed menu set up for this venue yet)",
      positionalMenuText: parts.join("\n"),
    },
  };
}
