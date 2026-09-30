"use client";

import { useEffect, useState } from "react";
import { LineChart, Loader2, Users, Eye, MousePointerClick, Percent, LucideIcon, Sparkles } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { WEBSITE_ANALYTICS_CONFIG } from "@/lib/marketing/website-analytics-config";
import { fetchWebsiteAnalyticsData, WebsiteAnalyticsResult, WebsiteAnalyticsBreakdownRow } from "@/lib/marketing/website-analytics";
import { fetchWebsiteAnalyticsInsights, WebsiteAnalyticsInsightsResult } from "@/lib/marketing/website-analytics-insights";

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function KpiTile({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-1.5 flex items-center gap-1.5 text-ink-soft">
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function BreakdownTable({ title, columnLabel, rows }: { title: string; columnLabel: string; rows: WebsiteAnalyticsBreakdownRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h4>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-cream-dim text-xs text-ink-soft">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{columnLabel}</th>
              <th className="px-3 py-2 text-right font-medium">Sessions</th>
              <th className="px-3 py-2 text-right font-medium">Active users</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="max-w-xs truncate px-3 py-2 text-ink" title={r.label}>
                  {r.label}
                </td>
                <td className="px-3 py-2 text-right text-ink-soft">{r.sessions.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-ink-soft">{r.activeUsers.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WebsiteAnalyticsPage() {
  const { venue } = useVenue();
  const config = WEBSITE_ANALYTICS_CONFIG[venue.slug];
  const [result, setResult] = useState<WebsiteAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(Boolean(config));
  const [insights, setInsights] = useState<WebsiteAnalyticsInsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading state for the new venue before the fetch resolves is intentional here
    setLoading(true);
    setInsights(null);
    fetchWebsiteAnalyticsData(venue.slug).then((res) => {
      if (cancelled) return;
      setResult(res);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug, config]);

  function handleGetInsights() {
    setInsightsLoading(true);
    fetchWebsiteAnalyticsInsights(venue.slug).then((res) => {
      setInsights(res);
      setInsightsLoading(false);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Website Analytics"
        subtitle={`What happens after someone finds ${venue.name} in search — sessions, which pages get read, and whether they actually try to book.`}
      />

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
          >
            <LineChart className="h-4 w-4" style={{ color: venue.accent }} />
          </span>
          <h3 className="text-sm font-semibold text-ink">Google Analytics (GA4)</h3>
        </div>

        {!config ? (
          <>
            <IntegrationNote
              text={`No GA4 property connected for ${venue.name} yet. This is the missing piece Search Console can't show: it tells you someone searched and clicked through, but not what they did once they landed — which pages they actually read, how long they stayed, and whether they clicked through to book a table.`}
            />
            <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
              <p>
                <span className="font-medium text-ink">First, check GA4 is even installed: </span>
                confirm {venue.name}&rsquo;s site has a Google Analytics 4 property set up (not the older Universal
                Analytics, which Google shut off) — if it&rsquo;s not there yet, that needs setting up on the site
                itself first.
              </p>
              <p>
                <span className="font-medium text-ink">Then it&rsquo;s the same pattern as Search Console: </span>
                a dedicated service account for this dashboard just needs to be added as a &ldquo;Viewer&rdquo; under GA4&rsquo;s Admin → Property Access
                Management, plus the property ID (a number, found under Admin → Property Details) added to this
                dashboard&rsquo;s config — no separate access request needed, unlike Google Business.
              </p>
              <p>
                <span className="font-medium text-ink">The number worth tracking most: </span>
                clicks on the &ldquo;Reserve a table&rdquo; / SevenRooms button — that&rsquo;s the one metric that
                actually connects search visibility to real bookings, rather than just traffic for its own sake.
                GA4&rsquo;s enhanced measurement already captures outbound clicks automatically, so this is
                queryable once there&rsquo;s enough real traffic to look at.
              </p>
            </div>
          </>
        ) : loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Website Analytics data...
          </div>
        ) : result && !result.ok ? (
          <IntegrationNote
            text={
              result.reason === "not-configured-env"
                ? "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY aren't set in this environment yet (same service account used for Search Console) — add them to .env.local and Vercel to switch this on."
                : result.message
            }
          />
        ) : result && result.ok ? (
          <>
            <p className="mb-4 text-xs text-ink-soft">
              {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(result.data.startDate))} –{" "}
              {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(result.data.endDate))}
            </p>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiTile icon={Users} label="Sessions" value={result.data.totals.sessions.toLocaleString()} accent={venue.accent} />
              <KpiTile icon={Eye} label="Active users" value={result.data.totals.activeUsers.toLocaleString()} accent={venue.accent} />
              <KpiTile icon={MousePointerClick} label="Page views" value={result.data.totals.pageViews.toLocaleString()} accent={venue.accent} />
              <KpiTile icon={Percent} label="Engagement rate" value={formatPercent(result.data.totals.engagementRate)} accent={venue.accent} />
            </div>

            <div className="space-y-5">
              <BreakdownTable title="Top pages" columnLabel="Page" rows={result.data.topPages} />
              <BreakdownTable title="Traffic sources" columnLabel="Channel" rows={result.data.channels} />
            </div>
          </>
        ) : null}
      </div>

      {result?.ok && (
        <div className="mt-5 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: venue.accent }} />
              </span>
              <h3 className="text-sm font-semibold text-ink">What to do about it</h3>
            </div>
            <button
              onClick={handleGetInsights}
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
              Reads the numbers above and turns them into specific next steps — which pages are pulling their weight,
              which traffic channels are underused, that kind of thing.
            </p>
          )}

          {insightsLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading the data and working out what matters...
            </div>
          )}

          {insights && !insights.ok && <IntegrationNote text={insights.message} />}

          {insights?.ok && (
            <div>
              <p className="mb-4 text-sm leading-relaxed text-ink">{insights.data.summary}</p>
              <div className="space-y-2.5">
                {insights.data.recommendations.map((rec, i) => (
                  <div key={i} className="rounded-lg bg-cream-dim px-3.5 py-3">
                    <p className="text-sm font-semibold text-ink">{rec.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{rec.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
