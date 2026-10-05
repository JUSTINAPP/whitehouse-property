// Shared text-formatting logic for menu item descriptions and section notes,
// used identically by the web editor/preview (menu-print-sheet.tsx) and the
// PDF export (pdf-text.ts/build.ts) so both always render the same thing.
//
// A "bold" segment here means Brown Pro Regular instead of Light -- there is
// no true bold weight in this type spec (see build.ts), Regular just reads
// darker/heavier at these sizes, which is what "bold" means in this editor.
//
// Two ways a segment becomes bold:
//  1. Explicit: the user wraps text in **double asterisks** via the Bold
//     toggle in the editor (see toggleBoldMarkup below) -- works on any
//     selected text, not just numbers.
//  2. Automatic: a "+N" add-on price (e.g. "add bacon +5", "+3.50") is
//     always bold even without manual marking, since every description with
//     one of these needs it and typing ** around each one by hand would be
//     tedious. Manually bolding something else doesn't disable this.

export interface TextSegment {
  text: string;
  bold: boolean;
}

const PRICE_TOKEN_RE = /\+\d+(?:\.\d{1,2})?/g;
const BOLD_MARKUP_RE = /\*\*(.+?)\*\*/g;

function splitPriceTokens(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(PRICE_TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) segments.push({ text: text.slice(lastIndex, start), bold: false });
    segments.push({ text: match[0], bold: true });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), bold: false });
  return segments;
}

export function parseFormattedText(raw: string): TextSegment[] {
  if (!raw) return [];
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const match of raw.matchAll(BOLD_MARKUP_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) segments.push(...splitPriceTokens(raw.slice(lastIndex, start)));
    segments.push({ text: match[1], bold: true });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < raw.length) segments.push(...splitPriceTokens(raw.slice(lastIndex)));
  return segments;
}

/**
 * Wraps (or unwraps, if the selection is already wrapped) the selected
 * range of a raw editor value in "**...**" bold markup, and returns where
 * the selection should land afterwards so the editor can restore focus.
 * Pure logic, no DOM -- the caller supplies selectionStart/End from its own
 * <textarea>.
 */
export function toggleBoldMarkup(
  value: string,
  selectionStart: number,
  selectionEnd: number
): { value: string; selectionStart: number; selectionEnd: number } {
  if (selectionStart === selectionEnd) {
    return { value, selectionStart, selectionEnd };
  }
  const before = value.slice(0, selectionStart);
  const selected = value.slice(selectionStart, selectionEnd);
  const after = value.slice(selectionEnd);

  const alreadyBold = selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4;
  if (alreadyBold) {
    const unwrapped = selected.slice(2, -2);
    return { value: before + unwrapped + after, selectionStart, selectionEnd: selectionStart + unwrapped.length };
  }

  const wrapped = `**${selected}**`;
  return { value: before + wrapped + after, selectionStart, selectionEnd: selectionStart + wrapped.length };
}
