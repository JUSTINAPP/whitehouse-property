import { NextRequest, NextResponse } from "next/server";
import { buildPiecePdf } from "@/lib/menu-print/build";
import { getPieceDef } from "@/lib/menu-print/pieces";
import type { PrintPieceDoc } from "@/lib/menu-print/types";
import type { VenueSlug } from "@/lib/types";

// Reads font files and artwork from disk and uses pdf-lib/opentype.js, none
// of which are edge-safe.
export const runtime = "nodejs";

/**
 * Builds the print PDF for one menu piece from the document the editor
 * currently has in state (not a fresh database read), so the live preview
 * and the downloaded file always match exactly what's on screen. Text is
 * drawn as outlined vector paths -- no font program is embedded.
 *
 * `download: true` returns it as an attachment; otherwise it's inline for
 * the preview pane. Any layout problems come back in X-Menu-Warnings.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const venueSlug = body?.venueSlug as VenueSlug | undefined;
    const pieceKey = body?.pieceKey as string | undefined;
    const doc = body?.doc as PrintPieceDoc | undefined;

    const def = venueSlug && pieceKey ? getPieceDef(venueSlug, pieceKey) : undefined;
    if (!def || !venueSlug || !pieceKey) {
      return NextResponse.json({ error: "Unknown venue or menu piece" }, { status: 400 });
    }
    if (!doc || !Array.isArray(doc.pages)) {
      return NextResponse.json({ error: "Missing or malformed menu document" }, { status: 400 });
    }

    const { bytes, warnings } = await buildPiecePdf(doc, def);

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${body?.download ? "attachment" : "inline"}; filename="${venueSlug}-${pieceKey}-menu.pdf"`,
        "X-Menu-Warnings": encodeURIComponent(JSON.stringify(warnings)),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Menu PDF build failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error building the PDF." }, { status: 500 });
  }
}
