import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { VenueProvider } from "@/context/venue-context";
import { AppShell } from "@/components/layout/app-shell";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

// Loaded specifically so the Guidelines / Menu pages under Social Calendar
// can reproduce each venue's own website typography (Cormorant + Jost),
// rather than the dashboard's default DM Sans.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Whitehouse Property Group | Dashboard",
  description: "Multi-venue operations dashboard for Whitehouse Property Group",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${cormorant.variable} ${jost.variable} h-full`}>
      <body className="min-h-full bg-cream text-ink antialiased">
        <VenueProvider>
          <AppShell>{children}</AppShell>
        </VenueProvider>
      </body>
    </html>
  );
}
