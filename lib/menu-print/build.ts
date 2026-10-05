import fs from "fs";
import path from "path";
import { PDFDocument, PDFImage, PDFPage, rgb } from "pdf-lib";
import { loadBrownProFonts } from "./fonts";
import { buildFormattedRuns, drawOutlinedText, drawRichTextLine, measureTextWidth, TextRun, wrapRichText, wrapText } from "./pdf-text";
import type { PieceDef, PrintItem, PrintPage, PrintPieceDoc, PrintSection } from "./types";

// Builds a print-ready PDF for one menu piece: one PDF page per PrintPage,
// at the piece's real media size, with the page artwork laid underneath and
// the menu text drawn on top as outlined Brown Pro vector paths (no font
// program is embedded -- see fonts.ts). Everything is sized relative to the
// piece's baseSize so an A5 booklet and an A4 menu share one layout engine.

const DEFAULT_INK = "#1A1916";

type Fonts = ReturnType<typeof loadBrownProFonts>;

export interface BuildResult {
  bytes: Uint8Array;
  // Human-readable problems worth showing in the editor (e.g. text running off a page).
  warnings: string[];
}

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return rgb(1, 1, 1);
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

async function loadImageBytes(url: string): Promise<Buffer> {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch background image: ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFileSync(path.join(process.cwd(), "public", url.replace(/^\//, "")));
}

async function embedImage(pdfDoc: PDFDocument, url: string, cache: Map<string, PDFImage>): Promise<PDFImage> {
  const hit = cache.get(url);
  if (hit) return hit;
  const bytes = await loadImageBytes(url);
  const lower = url.toLowerCase().split("?")[0];
  const img = lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
  cache.set(url, img);
  return img;
}

function isCallout(text: string): boolean {
  return /[A-Z]/.test(text) && text === text.toUpperCase();
}

function lineWidth(line: ReturnType<typeof wrapRichText>[number]): number {
  let w = 0;
  line.forEach((t, i) => {
    if (i > 0) w += measureTextWidth(t.font, " ", t.size);
    w += t.width;
  });
  return w;
}

interface Scale {
  ink: ReturnType<typeof rgb>;
  titleInk: ReturnType<typeof rgb>;
  b: number; // base text size
  title: number;
  diet: number;
  line: number;
  itemGap: number;
  sectionGap: number;
}

function scaleFor(def: PieceDef, spacing = 1): Scale {
  const base = def.format.baseSize;
  const ink = hexToRgb(def.format.inkColor ?? DEFAULT_INK);
  return {
    ink,
    titleInk: def.format.titleColor ? hexToRgb(def.format.titleColor) : ink,
    b: base,
    title: base * 1.95,
    diet: base * 0.84,
    line: base * 1.32,
    itemGap: base * 0.5 * spacing,
    sectionGap: base * 1.45 * Math.max(1, spacing * 0.8),
  };
}

interface Cursor {
  y: number;
}

// ---------------------------------------------------------------- items

function drawItem(
  page: PDFPage,
  fonts: Fonts,
  def: PieceDef,
  sc: Scale,
  section: PrintSection,
  item: PrintItem,
  x0: number,
  x1: number,
  cur: Cursor
) {
  const { b } = sc;
  const sep = def.format.separator;
  const cols = section.priceColumns;
  const colW = b * 4.6;

  // Width reserved on the right for the price so the text wraps short of it.
  let gutter = 0;
  if (cols && cols.length) gutter = cols.length * colW + 6;
  else if (item.price) gutter = Math.max(30, measureTextWidth(fonts.regular, item.price, b) + 14);

  const runs: TextRun[] = [{ text: item.name, font: fonts.regular, size: b, color: sc.ink }];
  if (item.description) runs.push(...buildFormattedRuns(sep ? `${sep} ${item.description}` : item.description, fonts.light, fonts.regular, b, sc.ink));
  if (item.dietary.length > 0) runs.push({ text: `(${item.dietary.join(", ")})`, font: fonts.light, size: sc.diet, color: sc.ink });

  const lines = wrapRichText(runs, x1 - x0 - gutter);
  lines.forEach((line, i) => {
    drawRichTextLine(page, line, x0, cur.y);
    if (i === 0 && item.price) drawPrice(page, fonts, section, item.price, x1, cur.y, b, colW, sc.ink);
    cur.y -= sc.line;
  });

  if (item.note) {
    const noteRuns = buildFormattedRuns(item.note, fonts.light, fonts.regular, b, sc.ink);
    for (const line of wrapRichText(noteRuns, x1 - x0 - (cols ? gutter : 0))) {
      drawRichTextLine(page, line, x0, cur.y);
      cur.y -= sc.line;
    }
  }
  cur.y -= sc.itemGap;
}

function drawPrice(page: PDFPage, fonts: Fonts, section: PrintSection, price: string, x1: number, y: number, b: number, colW: number, ink: ReturnType<typeof rgb>) {
  const cols = section.priceColumns;
  if (!cols || cols.length === 0) {
    drawOutlinedText(page, fonts.regular, price, { x: x1, y, size: b, color: ink, align: "right" });
    return;
  }
  const values = price.split("/").map((v) => v.trim());
  // Right-align the values to the column grid, last value in the last column.
  const offset = cols.length - values.length;
  values.forEach((v, i) => {
    if (!v || v === "-") return;
    const colIndex = i + Math.max(0, offset);
    const right = x1 - (cols.length - 1 - colIndex) * colW;
    drawOutlinedText(page, fonts.regular, v, { x: right, y, size: b, color: ink, align: "right" });
  });
}

function drawCenteredItem(page: PDFPage, fonts: Fonts, sc: Scale, item: PrintItem, cx: number, maxWidth: number, cur: Cursor) {
  const runs: TextRun[] = [{ text: item.name, font: fonts.light, size: sc.b, color: sc.ink }];
  if (item.description) runs.push(...buildFormattedRuns(item.description, fonts.light, fonts.regular, sc.b, sc.ink));
  for (const line of wrapRichText(runs, maxWidth)) {
    drawRichTextLine(page, line, cx - lineWidth(line) / 2, cur.y);
    cur.y -= sc.line;
  }
  cur.y -= sc.itemGap * 0.5;
}

// ------------------------------------------------------------- sections

function drawSection(page: PDFPage, fonts: Fonts, def: PieceDef, sc: Scale, section: PrintSection, x0: number, x1: number, cur: Cursor, center: boolean) {
  const cx = (x0 + x1) / 2;
  const width = x1 - x0;

  if (center) {
    drawOutlinedText(page, fonts.regular, section.title, { x: cx, y: cur.y, size: sc.b * 1.35, color: sc.titleInk, align: "center" });
    cur.y -= sc.line * 1.35;
    if (section.subtitle) {
      for (const l of wrapText(fonts.light, section.subtitle, sc.b, width)) {
        drawOutlinedText(page, fonts.light, l, { x: cx, y: cur.y, size: sc.b, color: sc.ink, align: "center" });
        cur.y -= sc.line;
      }
    }
    for (const item of section.items) drawCenteredItem(page, fonts, sc, item, cx, width, cur);
    cur.y -= sc.sectionGap * 1.1;
    return;
  }

  drawOutlinedText(page, fonts.light, section.title, { x: x0, y: cur.y, size: sc.title, color: sc.titleInk });
  cur.y -= sc.title * 0.3 + sc.b * 1.25;

  if (section.subtitle) {
    for (const l of wrapText(fonts.light, section.subtitle, sc.b, width)) {
      drawOutlinedText(page, fonts.light, l, { x: x0, y: cur.y, size: sc.b, color: sc.ink });
      cur.y -= sc.line;
    }
  }

  if (section.priceColumns && section.priceColumns.length) {
    const colW = sc.b * 4.6;
    const n = section.priceColumns.length;
    section.priceColumns.forEach((label, i) => {
      drawOutlinedText(page, fonts.light, label, { x: x1 - (n - 1 - i) * colW, y: cur.y + sc.line * 0.15, size: sc.b * 0.8, color: sc.ink, align: "right" });
    });
    cur.y -= sc.line * 0.7;
  }

  for (const item of section.items) drawItem(page, fonts, def, sc, section, item, x0, x1, cur);

  if (section.note) {
    if (isCallout(section.note)) {
      cur.y -= sc.line * 1.6;
      drawOutlinedText(page, fonts.light, section.note, { x: (x0 + x1) / 2, y: cur.y, size: sc.b * 1.5, color: sc.ink, align: "center", letterSpacing: sc.b * 0.18 });
      cur.y -= sc.line * 1.3;
    } else {
      const noteRuns = buildFormattedRuns(section.note, fonts.light, fonts.regular, sc.b, sc.ink);
      for (const line of wrapRichText(noteRuns, width)) {
        drawRichTextLine(page, line, x0, cur.y);
        cur.y -= sc.line;
      }
    }
  }
  cur.y -= sc.sectionGap;
}

// ----------------------------------------------------------------- pages

function drawFooter(page: PDFPage, fonts: Fonts, def: PieceDef, sc: Scale, p: PrintPage, x0: number, x1: number): number {
  if (!p.footer) return def.format.trim.y0 + def.format.margin;
  const size = Math.max(5, sc.b * 0.72);
  const lh = size * 1.35;
  const lines: string[] = [];
  for (const raw of p.footer.split("\n")) lines.push(...wrapText(fonts.light, raw, size, x1 - x0));
  const bottom = def.format.trim.y0 + def.format.margin * 0.8;
  let y = bottom + (lines.length - 1) * lh;
  const center = p.footerAlign !== "left";
  for (const l of lines) {
    drawOutlinedText(page, fonts.light, l, center ? { x: (x0 + x1) / 2, y, size, color: sc.ink, align: "center" } : { x: x0, y, size, color: sc.ink });
    y -= lh;
  }
  return bottom + lines.length * lh;
}

function drawContentPage(page: PDFPage, fonts: Fonts, def: PieceDef, p: PrintPage, warnings: string[]) {
  const sc = scaleFor(def, p.spacing ?? 1);
  const { trim, margin } = def.format;
  const x0 = trim.x0 + margin;
  const x1 = trim.x1 - margin;
  const topY = trim.y1 - margin;
  const center = p.align === "center";

  let startY = topY - (p.contentTop ?? 0);

  if (p.title) {
    const size = center ? sc.title * 1.15 : sc.b * 2.3;
    const align = p.titleAlign ?? (center ? "center" : "left");
    const lh = size * 1.25;
    let y = topY - size * 0.75 - (center ? p.contentTop ?? 0 : 0);
    const lines = p.title.split("\n");
    for (const l of lines) {
      const spacing = center ? 0 : size * 0.1;
      const x = align === "right" ? x1 : align === "center" ? (x0 + x1) / 2 : x0;
      drawOutlinedText(page, fonts.light, l, { x, y, size, color: sc.titleInk, align, letterSpacing: spacing });
      y -= lh;
    }
    if (p.titleNote) {
      const ns = sc.b * 0.95;
      const x = align === "right" ? x1 : align === "center" ? (x0 + x1) / 2 : x0;
      drawOutlinedText(page, fonts.light, p.titleNote, { x, y: y + lh * 0.35, size: ns, color: sc.ink, align, letterSpacing: ns * 0.15 });
      y -= ns * 1.2;
    }
    startY = Math.min(startY, y);
    if (center) startY = y - sc.line * 0.9;
  }

  const cur: Cursor = { y: startY - sc.title * 0.75 };
  if (center) cur.y = startY - sc.line * 0.5;
  for (const section of p.sections) drawSection(page, fonts, def, sc, section, x0, x1, cur, center);

  const footerTop = drawFooter(page, fonts, def, sc, p, x0, x1);
  const lastBaseline = cur.y + sc.sectionGap; // undo the trailing gap
  if (lastBaseline < footerTop) warnings.push(`"${p.label}": the content runs into the bottom of the page (${Math.ceil(footerTop - lastBaseline)}pt too long) — shorten it or reduce items.`);
}

export async function buildPiecePdf(doc: PrintPieceDoc, def: PieceDef): Promise<BuildResult> {
  const fonts = loadBrownProFonts();
  const pdfDoc = await PDFDocument.create();
  const cache = new Map<string, PDFImage>();
  const warnings: string[] = [];
  const { mediaW, mediaH, trim } = def.format;

  for (const p of doc.pages) {
    const page = pdfDoc.addPage([mediaW, mediaH]);
    if (trim.x0 !== 0 || trim.y0 !== 0 || trim.x1 !== mediaW || trim.y1 !== mediaH) {
      page.setTrimBox(trim.x0, trim.y0, trim.x1 - trim.x0, trim.y1 - trim.y0);
    }
    if (p.background.color) page.drawRectangle({ x: 0, y: 0, width: mediaW, height: mediaH, color: hexToRgb(p.background.color) });
    if (p.background.imageUrl) {
      try {
        const img = await embedImage(pdfDoc, p.background.imageUrl, cache);
        page.drawImage(img, { x: 0, y: 0, width: mediaW, height: mediaH });
      } catch {
        warnings.push(`"${p.label}": couldn't load its background artwork.`);
      }
    }
    if (p.kind === "content") drawContentPage(page, fonts, def, p, warnings);
  }

  return { bytes: await pdfDoc.save(), warnings };
}
