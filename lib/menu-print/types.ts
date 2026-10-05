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
  nameExtra?: string; // light text on the name line after the dietary tags (e.g. "add cheese +4")
}

export interface PrintSection {
  key: string;
  title: string;
  subtitle?: string; // a short intro sentence under the title
  note?: string; // trailing line after the items; ALL CAPS notes print as a centred call-out
  priceColumns?: string[]; // column headings for multi-price items (e.g. ["150ml","250ml","BTL"]); "" = a column with no heading
  priceColumnWidth?: number; // points between price columns (default scales with text size)
  titleExtra?: string; // small light text on the title line after the title (e.g. "all served with fries")
  titleSize?: number; // multiple of the default section title size
  titleSpread?: boolean; // stretch the title letter-spacing to span the full column width
  noRule?: boolean; // skip the dotted rule under this title (only for pieces that draw rules)
  ruleWidth?: number; // shorten the dotted rule to this many points (e.g. to stop short of an illustration)
  items: PrintItem[];
  column?: number; // which PrintPage.columns entry this section sits in (default 0)
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
  // Pages laid out in several columns (e.g. an A3 spread). Each column has
  // its own x-range in media points; sections choose a column with
  // PrintSection.column (0-based, default 0). Omit for a normal one-column page.
  columns?: PrintColumn[];
  sections: PrintSection[];
}

export interface PrintColumn {
  x0: number; // media coordinates, points from the left edge
  x1: number;
  align?: "left" | "center";
  titleInset?: number; // points down from the trim top to the column title baseline (default topInset)
  spacing?: number; // spacing multiplier for this column (overrides the page's)
  topInset?: number; // points down from the trim top where this column's content (or title) starts
  title?: string; // optional big heading at the top of the column ("\n"-separated)
  titleSize?: number; // pt, default scales from the text size
  titleRule?: boolean; // dotted rule under the column title
  sectionTitleScale?: number; // centred columns: section title size as a multiple of the text size
  inkColor?: string; // override text colour for this column (e.g. cream on a coloured panel)
  titleColor?: string;
  footer?: string; // small print pinned to the foot of the column
  footerInset?: number; // points up from the trim bottom to the last footer baseline
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
  descriptionBelow?: boolean; // description prints on its own line(s) under the item name instead of running on after it
  lineScale?: number; // line height as a multiple of baseSize (default 1.32)
  dietaryScale?: number; // dietary tag size as a multiple of baseSize (default 0.84)
  titleScale?: number; // section title size as a multiple of baseSize (default 1.95)
  titleRule?: boolean; // dotted rule under every section title
  inkColor?: string; // body text colour, hex (default near-black)
  titleColor?: string; // section heading colour, hex (default = inkColor)
}

export interface PieceDef {
  key: string;
  label: string;
  description: string;
  format: PieceFormat;
}
