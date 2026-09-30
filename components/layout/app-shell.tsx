"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTopbar } from "@/components/layout/mobile-topbar";

// /login is a standalone auth screen — no sidebar/venue chrome around it.
// Kept as a pathname check here (rather than a route-group layout) so the
// rest of the app's file structure doesn't need to move.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <MobileTopbar />
      <main className="flex-1 min-w-0 lg:pl-72">{children}</main>
    </div>
  );
}
