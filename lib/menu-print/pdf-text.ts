import type { PDFPage, Color } from "pdf-lib";
import type { Font as OpentypeFont } from "opentype.js";
import { parseFormattedText } from "@/lib/menu-text-formatting";

// Outlines text with opentype.js and draws it as a vector path on a pdf-lib
// page -- no embedded font program, just glyph shapes (see fonts.ts for
// why). Verified empirically: opentype's Path.toPathData() is in the same
// y-down convention pdf-lib's drawSvgPath expects, and getPath(text, 0, 0,
// size) + drawSvgPath(d, { x, y }) places the text's left baseline exactly
// at (x, y) in PDF page coordinates, right-side up.

// Widths are the sum of per-character advances, matching exactly how
// drawOutlinedText() lays glyphs out (one character at a time, no kerning).
// Using the font's own kerned string width instead made measured words
// narrower than what was drawn, so the next word ran into the previous one
// (most visible in ALL CAPS names).
export function measureTextWidth(font: OpentypeFont, text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) w += font.getAdvanceWidth(ch, fontSize);
  return w;
}

export interface DrawTextOptions {
  x: number;
  y: number; // baseline
  size: number;
  color: Color;
  align?: "left" | "right" | "center";
  letterSpacing?: number; // extra pt added after each character (for tracked-out uppercase titles)
}

export function drawOutlinedText(page: PDFPage, font: OpentypeFont, text: string, options: DrawTextOptions) {
  if (!text) return;
  const { size, color, align = "left", letterSpacing = 0, y } = options;
  let { x } = options;

  const baseWidth = measureTextWidth(font, text, size);
  const totalWidth = letterSpacing ? baseWidth + letterSpacing * (text.length - 1) : baseWidth;

  if (align === "right") x -= totalWidth;
  else if (align === "center") x -= totalWidth / 2;

  // Drawn one character at a time with manual advance, rather than handing
  // the whole string to font.getPath(). opentype.js's multi-character
  // getPath() applies kerning-pair lookups that, for this font, produce
  // literal "NaN" tokens in the emitted path data for some longer strings
  // (reproduced with runs containing several parentheses) -- pdf-lib then
  // throws trying to parse "NaN" as a number. Per-character advance avoids
  // that lookup entirely; the kerning lost is not visually meaningful for
  // menu text.
  let cursor = x;
  for (const ch of text) {
    const path = font.getPath(ch, 0, 0, size);
    const d = closeSvgSubpaths(path.toPathData(3));
    if (d && !d.includes("NaN")) {
      // A thin matching-colour stroke alongside the fill, not just the fill
      // alone. Brown Pro's monoline strokes (the crossbar of a capital T,
      // the arms of a V/X, ...) are under 1pt thick at the sizes this menu
      // uses (e.g. 0.9pt on a 9.5pt T) -- thin enough that at typical PDF
      // rasterization resolutions the fill can partially or mostly drop out
      // along that stroke, rendering as a faded diagonal sliver instead of
      // a solid bar (reproduced empirically: identical glyph, fill-only,
      // rendered broken in poppler AND Ghostscript; adding a matching
      // hairline stroke made every rasterizer render it solid). The stroke
      // is thin enough (0.3pt) not to visibly thicken normal letterforms.
      page.drawSvgPath(d, { x: cursor, y, color, borderColor: color, borderWidth: 0.3 });
    }
    cursor += font.getAdvanceWidth(ch, size) + letterSpacing;
  }
}

// opentype.js's Path.toPathData() never emits a "Z" (closepath) -- each
// contour ends one line/curve short of its starting point, relying on a
// renderer that auto-closes open subpaths for fill (as browsers do). This
// closes each contour explicitly so fill and the stroke above always trace
// the exact same, fully-closed outline.
function closeSvgSubpaths(d: string): string {
  if (!d) return d;
  return d.replace(/M/g, (match, offset) => (offset === 0 ? match : "Z" + match)) + "Z";
}

/**
 * Greedy word-wrap using the real font metrics, returning one array of
 * words per line. Used for menu item descriptions, which are free text and
 * may not fit on one line within a column's width.
 */
export function wrapText(font: OpentypeFont, text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureTextWidth(font, candidate, fontSize) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// --- Mixed-font ("rich text") line flow -----------------------------------
// A menu item is really one flowing line made of differently-styled runs --
// "Our Banana Bread" (Regular 9.5) + " | butter, local honey" (Light 9.5) +
// " (V)" (Light 8) -- that should wrap together as a single paragraph, not
// as three independently-wrapped blocks. These helpers tokenize a list of
// runs into words (keeping each word's own font/size/color) and greedily
// pack them into lines against a shared maxWidth, the same way a word
// processor would.

export interface TextRun {
  text: string;
  font: OpentypeFont;
  size: number;
  color: Color;
}

interface TextToken {
  text: string;
  font: OpentypeFont;
  size: number;
  color: Color;
  width: number;
}

function tokenizeRuns(runs: TextRun[]): TextToken[] {
  const tokens: TextToken[] = [];
  for (const run of runs) {
    if (!run.text) continue;
    for (const word of run.text.split(/\s+/).filter(Boolean)) {
      tokens.push({ text: word, font: run.font, size: run.size, color: run.color, width: measureTextWidth(run.font, word, run.size) });
    }
  }
  return tokens;
}

export function wrapRichText(runs: TextRun[], maxWidth: number): TextToken[][] {
  const tokens = tokenizeRuns(runs);
  const lines: TextToken[][] = [];
  let current: TextToken[] = [];
  let currentWidth = 0;

  for (const token of tokens) {
    const spaceWidth = current.length ? measureTextWidth(token.font, " ", token.size) : 0;
    const addedWidth = spaceWidth + token.width;
    if (current.length && currentWidth + addedWidth > maxWidth) {
      lines.push(current);
      current = [token];
      currentWidth = token.width;
    } else {
      current.push(token);
      currentWidth += addedWidth;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

export function drawRichTextLine(page: PDFPage, line: TextToken[], x: number, y: number) {
  let cursor = x;
  for (let i = 0; i < line.length; i++) {
    const token = line[i];
    if (i > 0) cursor += measureTextWidth(token.font, " ", token.size);
    drawOutlinedText(page, token.font, token.text, { x: cursor, y, size: token.size, color: token.color });
    cursor += token.width;
  }
}

// Menu descriptions and notes can carry bold (Regular-weight) fragments --
// either an automatic "+N" add-on price ("poached, fried or scrambled +2")
// or text the editor explicitly marked bold via "**...**" markup (see
// lib/menu-text-formatting.ts, shared with the web editor so both render
// identically). This turns a plain string into alternating Light/Regular
// TextRuns -- the token tokenizer in wrapRichText() then treats each
// resulting run independently, so a bold fragment mid-sentence gets its own
// Regular run without disturbing the words around it.
export function buildFormattedRuns(
  text: string,
  lightFont: OpentypeFont,
  regularFont: OpentypeFont,
  size: number,
  color: Color
): TextRun[] {
  return parseFormattedText(text).map((segment) => ({
    text: segment.text,
    font: segment.bold ? regularFont : lightFont,
    size,
    color,
  }));
}
