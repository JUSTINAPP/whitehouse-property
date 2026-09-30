import { readFileSync, writeFileSync } from "fs";

const data = JSON.parse(readFileSync("/tmp/seed.json", "utf-8"));

function q(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function jsonb(v) {
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

let sql = "";

for (const slug of Object.keys(data)) {
  const guests = data[slug].guests;
  if (guests.length === 0) continue;

  const guestValues = guests
    .map(
      (g) =>
        `(${q(g.id)}, ${q(slug)}, ${q(g.sevenrooms_client_id)}, ${q(g.name)}, ${q(g.email)}, ${q(g.phone)}, ${q(g.is_vip)}, ${q(g.notes)}, ${q(g.first_seen)}, ${q(g.last_seen)}, ${q(g.visit_count)}, ${q(g.total_spend)}, ${jsonb(g.highlights)})`
    )
    .join(",\n");

  sql += `insert into crm_guests (id, venue_slug, sevenrooms_client_id, name, email, phone, is_vip, notes, first_seen, last_seen, visit_count, total_spend, highlights) values\n${guestValues}\non conflict (venue_slug, sevenrooms_client_id) do nothing;\n\n`;

  const visitRows = [];
  for (const g of guests) {
    for (const v of g.visits ?? []) {
      visitRows.push(
        `(${q(slug)}, ${q(v.sevenrooms_reservation_id)}, ${q(g.id)}, ${q(g.sevenrooms_client_id)}, ${q(v.visit_date)}, ${q(v.party_size)}, 'confirmed', ${q(v.spend_total)}, ${q(v.notes)})`
      );
    }
  }
  if (visitRows.length > 0) {
    sql += `insert into crm_guest_visits (venue_slug, sevenrooms_reservation_id, guest_id, sevenrooms_client_id, visit_date, party_size, status, spend_total, notes) values\n${visitRows.join(",\n")}\non conflict (venue_slug, sevenrooms_reservation_id) do nothing;\n\n`;
  }
}

writeFileSync("/tmp/seed.sql", sql);
console.log("wrote", sql.length, "bytes");
