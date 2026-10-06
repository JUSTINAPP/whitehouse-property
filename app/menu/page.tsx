"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { MenuSectionBlock } from "@/components/social/menu-section";
import { PrintMenuStudio } from "@/components/menu/print-menu-studio";
import { VENUE_MENUS } from "@/lib/menu-data";
import { SITE_THEMES } from "@/lib/site-theme";
import { VENUE_PIECES } from "@/lib/menu-print/pieces";
import { fetchMenuInsights, MenuInsightsResult } from "@/lib/insights/menu-insights";
import { cn } from "@/lib/utils";

type ViewMode = "online" | "print";

export default function MenuPage() {
  const { venue } = useVenue();
  const menu = VENUE_MENUS[venue.slug];
  const theme = SITE_THEMES[venue.slug];
  const hasPrint = (VENUE_PIECES[venue.slug]?.length ?? 0) > 0;

  // Opens on Print layout when the venue has print menus set up -- that's
  // the working view; the online view is the guest-facing reference.
  const [view, setView] = useState<ViewMode>(hasPrint ? "print" : "online");
  const [insights, setInsights] = useState<MenuInsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting for the new venue is intentional here
    setView(hasPrint ? "print" : "online");
    setInsights(null);
  }, [venue.slug, hasPrint]);

  function handleGetMenuInsights() {
    setInsightsLoading(true);
    fetchMenuInsights(venue.slug).then((res) => {
      setInsights(res);
      setInsightsLoading(false);
    });
  }

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
      <PageHeader
        title="Current Menu"
        subtitle={
          view === "online"
            ? `The menu as guests see it online — styled to match ${venue.name}.`
            : `Edit ${venue.name}'s printed menus and download print-ready PDFs. The preview is the real PDF, rebuilt as you type.`
        }
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

      <div className="mb-5 flex w-fit items-center gap-1 rounded-lg border border-border bg-white p-1">
        {(["online", "print"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition",
              view === mode ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
            )}
          >
            {mode === "online" ? "Online" : "Print layout"}
          </button>
        ))}
      </div>

      {(menu || hasPrint) && (
        <div className="mb-5 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: venue.accent }} />
              </span>
              <h3 className="text-sm font-semibold text-ink">Menu insights</h3>
            </div>
            <button
              onClick={handleGetMenuInsights}
              disabled={insightsLoading}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: venue.accent }}
            >
              {insightsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {insights?.ok ? "Regenerate insights" : "Get AI insights"}
            </button>
          </div>

          {!insights && !insightsLoading && (
            <p className="text-sm text-ink-soft">
              Reads the menu in its real layout order{hasPrint ? " — the printed pieces, page by page and column by column, not just the list" : ""} and
              gives menu-engineering and pricing-psychology recommendations: positioning, price presentation, and structure. No sales data
              is connected yet, so this is grounded in layout and pricing craft, not what&apos;s actually selling.
            </p>
          )}

          {insightsLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading the menu...
            </div>
          )}

          {insights && !insights.ok && <IntegrationNote text={insights.message} />}

          {insights?.ok && (
            <div>
              <p className="mb-4 text-sm leading-relaxed text-ink">{insights.data.summary}</p>
              {insights.data.watchItems.length > 0 && (
                <div className="space-y-2.5">
                  {insights.data.watchItems.map((item, i) => (
                    <div key={i} className="rounded-lg bg-cream-dim px-3.5 py-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                          style={{ backgroundColor: venue.accent }}
                        >
                          {item.category}
                        </span>
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                      </div>
                      <p className="text-sm text-ink-soft">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === "print" ? (
        <PrintMenuStudio />
      ) : !menu ? (
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
