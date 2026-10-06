import { fetchPieceDoc } from "@/lib/menu-print/data";
import { VENUE_PIECES } from "@/lib/menu-print/pieces";
import { VENUE_MENUS } from "@/lib/menu-data";
import { VenueSlug } from "@/lib/types";

// One row the shot list can match a gallery photo against. For venues with
// print menus this reads every printed piece (saved version if there is one,
// otherwise the built-in starting content) so the shot list always matches
// what's actually printed; other venues fall back to the online menu. Keys
// are derived from piece + section + item name, so they stay stable when the
// menu is reordered or reprinted.
export interface ShotListItem {
  key: string;
  name: string;
  sectionTitle: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getShotListItems(venueSlug: VenueSlug): Promise<ShotListItem[]> {
  const pieces = VENUE_PIECES[venueSlug];
  if (pieces && pieces.length > 0) {
    const out: ShotListItem[] = [];
    const seen = new Set<string>();
    for (const piece of pieces) {
      const loaded = await fetchPieceDoc(venueSlug, piece.key);
      if (!loaded) continue;
      for (const page of loaded.doc.pages) {
        for (const section of page.sections) {
          for (const item of section.items) {
            if (!item.name.trim()) continue;
            const key = `${piece.key}-${slugify(section.title)}-${slugify(item.name)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ key, name: item.name, sectionTitle: `${section.title} · ${piece.label}` });
          }
        }
      }
    }
    if (out.length > 0) return out;
  }

  const onlineMenu = VENUE_MENUS[venueSlug];
  if (!onlineMenu) return [];

  return onlineMenu.groups.flatMap((group) =>
    group.sections.flatMap((section) =>
      section.items.map((item) => ({
        key: `${slugify(section.id)}-${slugify(item.name)}`,
        name: item.name,
        sectionTitle: section.title,
      }))
    )
  );
}
