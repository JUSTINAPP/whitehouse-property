/**
 * Seeds Supabase with realistic placeholder data for all three venues.
 * Run only after real Supabase credentials are set in .env.local:
 *   npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { VENUES } from "../lib/venues";
import { GUESTS } from "../lib/mock/guests";
import { RESERVATIONS_TODAY } from "../lib/mock/reservations";
import { SOCIAL_POSTS } from "../lib/mock/social-posts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || url === "your-supabase-url" || serviceKey === "your-service-role-key") {
  console.error("Supabase credentials are not configured in .env.local. Aborting seed.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function seed() {
  console.log("Seeding venues...");
  const { data: venueRows, error: venueError } = await supabase
    .from("venues")
    .upsert(
      VENUES.map((v) => ({ name: v.name, slug: v.slug, accent_color: v.accent })),
      { onConflict: "slug" }
    )
    .select();
  if (venueError) throw venueError;

  const venueIdBySlug = new Map(venueRows!.map((v) => [v.slug as string, v.id as string]));

  console.log("Seeding guests...");
  for (const venue of VENUES) {
    const venueId = venueIdBySlug.get(venue.slug);
    const rows = GUESTS[venue.slug].map((g) => ({
      venue_id: venueId,
      name: g.name,
      email: g.email,
      phone: g.phone,
      visit_count: g.visitCount,
      last_visit: g.lastVisit,
      total_spend: g.totalSpend,
      tags: g.tags,
      notes: g.notes ?? null,
    }));
    const { error } = await supabase.from("guests").insert(rows);
    if (error) throw error;
  }

  console.log("Seeding reservations...");
  for (const venue of VENUES) {
    const venueId = venueIdBySlug.get(venue.slug);
    const rows = RESERVATIONS_TODAY[venue.slug].map((r) => ({
      venue_id: venueId,
      guest_name: r.guestName,
      guest_email: r.guestEmail ?? null,
      party_size: r.partySize,
      reservation_date: r.reservationDate,
      reservation_time: r.reservationTime,
      table_number: r.tableNumber,
      status: r.status,
      special_notes: r.specialNotes ?? null,
    }));
    const { error } = await supabase.from("reservations").insert(rows);
    if (error) throw error;
  }

  console.log("Seeding social posts...");
  for (const venue of VENUES) {
    const venueId = venueIdBySlug.get(venue.slug);
    const rows = SOCIAL_POSTS[venue.slug].map((p) => ({
      venue_id: venueId,
      channel: p.channel,
      title: p.title,
      caption: p.caption,
      scheduled_date: p.scheduledDate,
      scheduled_time: p.scheduledTime,
      image_url: p.imageUrl,
      status: p.status,
    }));
    const { error } = await supabase.from("social_posts").insert(rows);
    if (error) throw error;
  }

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
