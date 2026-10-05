// Print menus are modelled per *piece*: one physical printed item (e.g. the
// Tilbury A4 dining menu, the A5 bar booklet). A piece is an ordered list of
// single pages, each either a "content" page (sections of items flowed top
// to bottom) or an "art" page (a cover / back page that is just artwork).
// Venues differ a lot in how many pieces they print and what size each is,
// so the set of pieces and their page geometry is configured per venue (see
// pieces.ts) and everything here is page-based, not panel-based.

export interface PrintItem {
  key: string;
  name: string;
  description: string;
  // Free text, right-aligned in the price column. When the section declares
  // priceColumns (e.g. wine: 150ml / 250ml / BTL) this holds one value per
  // column, separated by "/" -- blank "-" slots are allowed, e.g. "-/-/66".
  price: string;
  dietary: string[];
  // Optional trailing line printed under this item (e.g. "Add prawns +10").
  note?: string;
}

export interface PrintSection {
  key: string;
  title: string;
  subtitle?: string; // a short intro sentence under the title
  note?: string; // trailing line after the items; ALL CAPS notes print as a centred call-out
  priceColumns?: string[]; // column headings for multi-price items (e.g. ["150ml","250ml","BTL"])
  items: PrintItem[];
}

export interface PrintPageBackground {
  color?: string; // flat colour wash, hex
  imageUrl?: string; // full-media artwork (path under /public or a URL)
}

export interface PrintPage {
  key: string;
  label: string; // shown in the editor's page tabs
  kind: "content" | "art";
  background: PrintPageBackground;
  // Content pages only:
  align?: "left" | "center"; // "center" = every line centred (e.g. a "what's on" page)
  title?: string; // optional big heading block (multi-line, "\n"-separated)
  titleNote?: string; // small line under the title block
  titleAlign?: "left" | "right" | "center";
  contentTop?: number; // extra points between the top margin and the first section (room for a printed logo)
  footer?: string; // small print at the foot of the page ("\n"-separated lines)
  footerAlign?: "left" | "center";
  spacing?: number; // multiplier on the gaps between items and sections (default 1) -- airy menus use 2-3
  sections: PrintSection[];
}

export interface PrintPieceDoc {
  version: string;
  pages: PrintPage[];
}

// Geometry and type scale for one piece. All values in PDF points.
export interface PieceFormat {
  mediaW: number;
  mediaH: number;
  // The trim rectangle inside the media box (crop marks / bleed sit outside it).
  trim: { x0: number; y0: number; x1: number; y1: number };
  margin: number; // safe margin inside the trim edge
  baseSize: number; // item/description text size; everything else scales from it
  // How a description follows the item name: "|" (South Beach style) or "" (just a space).
  separator: "|" | "";
  inkColor?: string; // body text colour, hex (default near-black)
  titleColor?: string; // section heading colour, hex (default = inkColor)
}

export interface PieceDef {
  key: string;
  label: string;
  description: string;
  format: PieceFormat;
}
