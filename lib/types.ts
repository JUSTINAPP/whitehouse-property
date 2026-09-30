export type VenueSlug = "beach-road" | "barrys" | "tilbury" | "vicar";

export interface Venue {
  id: string;
  slug: VenueSlug;
  name: string;
  shortName: string;
  type: string;
  accent: string;
  accentLight: string;
}

export type SocialChannel = "instagram" | "facebook" | "tiktok" | "event" | "article";
export type SocialStatus = "draft" | "scheduled" | "published" | "failed";

// Content format — mirrors the Grid/Carousel/Reel/Story split used on the
// Content page's "Ready to Post" gallery, so the same vocabulary is used
// end to end. Most relevant for Instagram, but left open for other channels.
// "grid" is labelled "Photo" in post-facing UI (see lib/format-meta.ts) —
// the internal value is kept as "grid" so it still lines up with the
// Content page's Grid/Carousel/Reel/Story vocabulary.
export type PostFormat = "grid" | "carousel" | "reel" | "story";

export interface SocialPost {
  id: string;
  venueId: VenueSlug;
  channel: SocialChannel;
  format?: PostFormat;
  title: string;
  caption: string;
  contentBrief?: string | null; // creative direction for whoever produces the asset — separate from the caption
  scheduledDate: string; // yyyy-MM-dd
  scheduledTime: string; // HH:mm
  imageUrl: string | null;
  videoUrl?: string | null; // externally-hosted video for Reels (Shopify CDN, Cloudinary, etc) — never uploaded directly
  status: SocialStatus;
  likes?: number;
  comments?: number;
  reach?: number;
}

// A venue's Instagram connection, read from the venues_instagram_config
// table. Access tokens never leave the server in a real integration; here
// only the fields the dashboard needs to render connection status.
export interface InstagramConnection {
  venueId: VenueSlug;
  connected: boolean;
  username?: string | null;
  connectedAt?: string | null;
}

// Function / private-events bookings — separate from table Reservations.
// Volpino and South Beach both take private function enquiries (engagements,
// weddings, corporate, Christmas parties) that book out a private space
// rather than a table, and are won through marketing channels worth
// tracking separately (see the Functions ROAS template).
export type FunctionStatus = "enquiry" | "tentative" | "confirmed" | "cancelled";
export type FunctionEventType =
  | "Wedding"
  | "Engagement"
  | "Birthday"
  | "Corporate"
  | "Christmas Party"
  | "Wake"
  | "Christening"
  | "Other";

// Mirrors the channels a lead can arrive through, split into paid (has a
// media spend + CPC to track ROAS against) and organic/referral (no media
// spend, but still worth counting for close-rate and volume).
export type LeadSource =
  | "google-ads"
  | "instagram-ads"
  | "google-organic"
  | "instagram-organic"
  | "google-business"
  | "referral"
  | "repeat-guest"
  | "website-direct";

export interface FunctionBooking {
  id: string;
  venueId: VenueSlug;
  clientName: string;
  clientEmail: string;
  eventType: FunctionEventType;
  eventDate: string; // yyyy-MM-dd
  startTime: string;
  guestCount: number;
  space: string;
  avgSpendPerHead: number;
  totalValue: number;
  depositPaid: number;
  status: FunctionStatus;
  leadSource: LeadSource;
  enquiryDate: string; // yyyy-MM-dd — when the lead first came in
  notes?: string;
}

export type GuestTag = "VIP" | "Regular" | "Vegetarian" | "Vegan" | "Gluten-Free" | "Nut Allergy" | "Shellfish Allergy" | "Birthday Club" | "Wine Club" | "Corporate";

export interface VisitRecord {
  date: string;
  partySize: number;
  spend: number;
  notes?: string;
}

export interface Guest {
  id: string;
  venueId: VenueSlug;
  name: string;
  email: string;
  phone: string;
  visitCount: number;
  lastVisit: string;
  totalSpend: number;
  tags: GuestTag[];
  notes?: string; // synced from SevenRooms -- read-only, overwritten on every sync
  staffNotes?: string; // dashboard-only, editable by staff -- never touched by the sync
  highlights: GuestHighlight[]; // short glanceable flags, shown in the guest table row without clicking in
  visitHistory: VisitRecord[];
}

// "allergy" gets a distinct, hard-to-miss color everywhere it's shown --
// it's a safety flag, not a preference.
export type HighlightType = "allergy" | "seating" | "occasion" | "service" | "other";

export interface GuestHighlight {
  text: string;
  type: HighlightType;
}

export type ReservationStatus = "confirmed" | "pending" | "cancelled";

export interface Reservation {
  id: string;
  venueId: VenueSlug;
  guestName: string;
  guestEmail?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  tableNumber: string;
  status: ReservationStatus;
  specialNotes?: string;
  // SevenRooms client_id, live-sourced only -- used to cross-reference a
  // reservation against the synced crm_guests roster (VIP status,
  // highlights) without a second round of name/email matching.
  sevenroomsClientId?: string;
}

export interface EmailCampaign {
  id: string;
  venueId: VenueSlug;
  subject: string;
  sentDate: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  status: "sent" | "draft";
  preview: string;
}
