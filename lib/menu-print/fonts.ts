import fs from "fs";
import path from "path";
import * as opentype from "opentype.js";

// Server-only. The two Brown Pro weights actually used by the print menu's
// type spec (Title/description/dietary code = Light, item name/price =
// Regular) -- Bold/Thin aren't part of the spec, so they're not loaded.
//
// These .otf files live in assets/fonts/brown-pro (NOT public/), so they're
// never served to the browser. At export time we read the glyph outlines
// with opentype.js and draw them as plain vector paths in the PDF -- no
// font program is embedded -- per the Lineto EULA's distinction between
// "Standard Desktop/Print Use" (fine) and embedding Font Software in a
// document published/distributed for external business use, which needs a
// separate licensing extension (see the EULA at assets/fonts/brown-pro's
// source folders). Outlining sidesteps that entirely: the exported PDF
// contains only glyph shapes, no embedded font software.
const FONT_DIR = path.join(process.cwd(), "assets", "fonts", "brown-pro");

let cached: { light: opentype.Font; regular: opentype.Font } | null = null;

export function loadBrownProFonts(): { light: opentype.Font; regular: opentype.Font } {
  if (cached) return cached;

  const lightBuf = fs.readFileSync(path.join(FONT_DIR, "BrownPro-Light.otf"));
  const regularBuf = fs.readFileSync(path.join(FONT_DIR, "BrownPro-Regular.otf"));

  const toArrayBuffer = (buf: Buffer) => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  cached = {
    light: opentype.parse(toArrayBuffer(lightBuf)),
    regular: opentype.parse(toArrayBuffer(regularBuf)),
  };
  return cached;
}
