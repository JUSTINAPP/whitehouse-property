"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, CalendarDays, Users, ClipboardList, Mail, Palette, UtensilsCrossed, FolderOpen, Printer } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/social", label: "Social", icon: CalendarDays },
  { href: "/social/guidelines", label: "Guidelines", icon: Palette },
  { href: "/social/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/social/menu/print", label: "Print menus", icon: Printer },
  { href: "/social/content", label: "Content", icon: FolderOpen },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/reservations", label: "Reservations", icon: ClipboardList },
  { href: "/marketing", label: "Marketing", icon: Mail },
];

export function MobileTopbar() {
  const pathname = usePathname();
  const { venue, venues, setVenueSlug } = useVenue();

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-navy lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-lg font-semibold tracking-tight text-gold">Whitehouse Property</span>
        <select
          value={venue.slug}
          onChange={(e) => setVenueSlug(e.target.value as typeof venue.slug)}
          className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white"
        >
          {venues.map((v) => (
            <option key={v.slug} value={v.slug} className="text-ink">
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                active ? "text-white" : "text-white/50"
              )}
              style={active ? { backgroundColor: `color-mix(in srgb, ${venue.accent} 25%, transparent)` } : undefined}
            >
              <Icon className="h-3.5 w-3.5" style={active ? { color: venue.accent } : undefined} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
