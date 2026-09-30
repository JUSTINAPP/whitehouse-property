import { SANITY_CONFIG, SanityConfig } from "../sanity-config";
import { VenueSlug } from "../types";

export interface WhatsOnEvent {
  id: string;
  title: string;
  slug: string;
  date: string | null; // ISO datetime, as stored in Sanity
  price: string | null;
  bookingLink: string | null;
  bookingsRequired: boolean;
  published: boolean;
  imageUrl: string | null;
  description: string;
}

interface SanityBlockChild {
  text?: string;
}
interface SanityBlock {
  children?: SanityBlockChild[];
}
interface SanityEventDoc {
  _id: string;
  title?: string;
  slug?: { current?: string };
  date?: string;
  price?: string;
  bookingLink?: string;
  bookingsRequired?: boolean;
  published?: boolean;
  image?: { asset?: { _ref?: string } };
  description?: string | SanityBlock[];
}

// Sanity image refs look like image-<assetId>-<width>x<height>-<format>.
// This reconstructs the actual cdn.sanity.io URL without needing the
// Sanity client SDK (or any auth) — same asset delivery the sites use.
function sanityImageUrl(projectId: string, dataset: string, ref?: string): string | null {
  if (!ref) return null;
  const match = ref.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/);
  if (!match) return null;
  const [, assetId, dimensions, format] = match;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${format}`;
}

// South Beach's schema stores description as Portable Text (rich blocks);
// Volpino's stores it as a plain string. Normalise both to plain text —
// good enough for a read-only summary, no need to render rich formatting.
function flattenDescription(desc: SanityEventDoc["description"]): string {
  if (typeof desc === "string") return desc;
  if (Array.isArray(desc)) {
    return desc
      .map((block) => (block.children ?? []).map((c) => c.text ?? "").join(""))
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

/**
 * Server-side only — queries the venue's Sanity dataset directly. Lives
 * here (not just in the route handler) so the normalisation logic has one
 * home, but must only ever run on the server: Sanity's CORS allowlist for
 * both projects only covers the venues' own domains, not this dashboard's,
 * so a browser-side call to this same URL gets rejected. Route through
 * /api/whats-on (a Next.js server request, which isn't subject to browser
 * CORS at all) rather than calling Sanity directly from client code.
 */
export async function queryEventsServerSide(config: SanityConfig): Promise<WhatsOnEvent[] | null> {
  const query = encodeURIComponent('*[_type == "event"] | order(date asc)');
  const url = `https://${config.projectId}.api.sanity.io/v2021-10-21/data/query/${config.dataset}?query=${query}`;

  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const data: { result?: SanityEventDoc[] } = await res.json();
    const rows = Array.isArray(data.result) ? data.result : [];

    return rows.map((r) => ({
      id: r._id,
      title: r.title ?? "Untitled event",
      slug: r.slug?.current ?? "",
      date: r.date ?? null,
      price: r.price ?? null,
      bookingLink: r.bookingLink ?? null,
      bookingsRequired: Boolean(r.bookingsRequired),
      published: Boolean(r.published),
      imageUrl: sanityImageUrl(config.projectId, config.dataset, r.image?.asset?._ref),
      description: flattenDescription(r.description),
    }));
  } catch {
    return null;
  }
}

/**
 * Client-side — pulls "What's On" events via our own /api/whats-on route
 * (server-side proxy to Sanity, see queryEventsServerSide above). Returns
 * null if this venue has no Sanity project configured, or the request
 * fails, so callers can show a clear fallback rather than an error.
 */
export async function fetchWhatsOn(venueSlug: VenueSlug): Promise<WhatsOnEvent[] | null> {
  if (!SANITY_CONFIG[venueSlug]) return null;

  try {
    const res = await fetch(`/api/whats-on?venue=${venueSlug}`);
    if (!res.ok) return null;
    const data: { events?: WhatsOnEvent[] } = await res.json();
    return Array.isArray(data.events) ? data.events : null;
  } catch {
    return null;
  }
}
