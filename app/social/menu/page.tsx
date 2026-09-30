"use client";

import { ExternalLink } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { MenuSectionBlock } from "@/components/social/menu-section";
import { VENUE_MENUS } from "@/lib/menu-data";
import { SITE_THEMES } from "@/lib/site-theme";

export default function MenuPage() {
  const { venue } = useVenue();
  const menu = VENUE_MENUS[venue.slug];
  const theme = SITE_THEMES[venue.slug];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Current Menu"
        subtitle={`Live from ${venue.name}'s website — styled to match, so it reads the way guests see it.`}
        action={
          theme.siteUrl ? (
            <a
              href={`${theme.siteUrl}/menu`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
            >
              View live menu
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : undefined
        }
      />

      {!menu ? (
        <IntegrationNote text={`No menu linked for ${venue.name} yet — there's no website to pull it from. Connect one once ${venue.name} has a live site.`} />
      ) : (
        <div
          className="overflow-hidden rounded-xl border border-border"
          style={{ backgroundColor: theme.colors.cream }}
        >
          <div className="flex flex-col md:flex-row">
            {/* Side nav — category titles, mirrors the jump-nav pattern on the venue's own menu page */}
            <aside className="shrink-0 border-b border-border/70 px-5 py-6 md:w-52 md:border-b-0 md:border-r">
              <p
                className="mb-3 text-[10px] uppercase"
                style={{ fontFamily: theme.sansFont, color: theme.colors.warm, letterSpacing: "0.2em" }}
              >
                Jump to
              </p>
              <nav className="flex flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-2">
                {menu.groups.flatMap((g) => g.sections).map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-[13px] transition hover:underline"
                    style={{ fontFamily: theme.sansFont, color: theme.colors.charcoal }}
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Menu content */}
            <div className="min-w-0 flex-1 bg-white px-6 py-8 md:px-10">
              {menu.groups.map((group) => (
                <div key={group.id} className="mb-10 last:mb-0">
                  <p
                    className="mb-2.5 text-[10px] uppercase"
                    style={{ fontFamily: theme.sansFont, color: theme.colors.primary, letterSpacing: "0.2em" }}
                  >
                    {group.label}
                  </p>
                  <h2
                    className="mb-1 text-[34px] font-light leading-[1.05] md:text-[40px]"
                    style={{ fontFamily: theme.displayFont, color: theme.colors.charcoal, letterSpacing: "0.02em" }}
                  >
                    {group.heading}
                  </h2>
                  <p
                    className="mb-7 text-[17px] italic font-light"
                    style={{ fontFamily: theme.displayFont, color: theme.colors.warm }}
                  >
                    {group.subheading}
                  </p>

                  {group.sections.map((section) => (
                    <MenuSectionBlock key={section.id} section={section} theme={theme} />
                  ))}
                </div>
              ))}

              <div
                className="mt-8 rounded border-l-2 px-4 py-3.5 text-[11px] font-light leading-relaxed"
                style={{
                  backgroundColor: theme.colors.primaryLight,
                  borderColor: theme.colors.primary,
                  color: theme.colors.primaryDark,
                  fontFamily: theme.sansFont,
                }}
              >
                {menu.allergenNote}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
