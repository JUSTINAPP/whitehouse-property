"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  CalendarDays,
  Users,
  ClipboardList,
  Mail,
  Calendar,
  Palette,
  UtensilsCrossed,
  Camera,
  TrendingUp,
  BarChart4,
  FolderOpen,
  BarChart3,
  PartyPopper,
  LineChart,
  UserCog,
  LogOut,
  Megaphone,
  Sparkles,
  Search,
  Target,
  MapPin,
  Star,
} from "lucide-react";
import { VenueSwitcher } from "./venue-switcher";
import { useVenue } from "@/context/venue-context";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, initials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  {
    href: "/social",
    label: "Social Calendar",
    icon: CalendarDays,
    children: [
      { href: "/social", label: "Calendar", icon: Calendar },
      { href: "/social/ideas", label: "Ideas", icon: Sparkles },
      { href: "/social/whats-on", label: "What's on", icon: Megaphone },
      { href: "/social/guidelines", label: "Guidelines", icon: Palette },
      { href: "/social/content", label: "Content", icon: FolderOpen },
      { href: "/social/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    href: "/menu",
    label: "Menu",
    icon: UtensilsCrossed,
    children: [
      { href: "/menu", label: "Current Menu", icon: UtensilsCrossed },
      { href: "/menu/gallery", label: "Shot List & Gallery", icon: Camera },
      { href: "/menu/strategy", label: "Food Strategy", icon: TrendingUp },
      { href: "/menu/performance", label: "Performance", icon: BarChart4 },
    ],
  },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/reservations", label: "Reservations", icon: ClipboardList },
  {
    href: "/functions",
    label: "Functions",
    icon: PartyPopper,
    children: [
      { href: "/functions", label: "Calendar", icon: Calendar },
      { href: "/functions/analytics", label: "Analytics", icon: LineChart },
    ],
  },
  {
    href: "/marketing",
    label: "Marketing",
    icon: Mail,
    children: [
      { href: "/marketing", label: "Campaigns", icon: Mail },
      { href: "/marketing/search-console", label: "Search & Visibility", icon: Search },
      { href: "/marketing/google-business", label: "Google Business", icon: MapPin },
      { href: "/marketing/google-ads", label: "Google Ads", icon: Target },
      { href: "/marketing/website-analytics", label: "Website Analytics", icon: LineChart },
      { href: "/marketing/reviews", label: "Reviews", icon: Star },
    ],
  },
  { href: "/settings/users", label: "Manage users", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { venue } = useVenue();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    client.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  async function handleSignOut() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    await client.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-navy lg:flex">
      <div className="flex items-center gap-2 px-6 pt-7 pb-5">
        <span className="text-xl font-semibold tracking-tight text-gold">Whitehouse Property</span>
      </div>

      <div className="px-4 pb-5">
        <VenueSwitcher />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4">
        {NAV_ITEMS.map((item) => {
          const hasChildren = "children" in item && !!item.children?.length;
          const sectionActive = hasChildren
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : pathname === item.href;
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  sectionActive ? "text-white" : "text-white/55 hover:bg-white/5 hover:text-white/85"
                )}
                style={sectionActive && !hasChildren ? { backgroundColor: `color-mix(in srgb, ${venue.accent} 22%, transparent)` } : undefined}
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  style={sectionActive ? { color: venue.accent } : undefined}
                />
                {item.label}
                {sectionActive && !hasChildren && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: venue.accent }} />
                )}
              </Link>

              {hasChildren && sectionActive && (
                <div className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 pl-4">
                  {item.children!.map((child) => {
                    const childActive = pathname === child.href;
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
                          childActive ? "text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                        )}
                        style={childActive ? { backgroundColor: `color-mix(in srgb, ${venue.accent} 18%, transparent)` } : undefined}
                      >
                        <ChildIcon className="h-3.5 w-3.5 shrink-0" style={childActive ? { color: venue.accent } : undefined} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
            {initials(userEmail ?? "Jonas Allen")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userEmail ?? "Jonas Allen"}</p>
            <p className="truncate text-xs text-white/45">Operations</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/5 hover:text-white/85"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
