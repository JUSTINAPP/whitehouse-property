"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MousePointerClick,
  Eye,
  Percent,
  ListOrdered,
  Search,
  Star,
  LucideIcon,
  Sparkles,
} from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { SEARCH_CONSOLE_CONFIG } from "@/lib/marketing/search-console-config";
import { fetchSearchConsoleData, SearchConsoleResult, SearchConsoleBreakdownRow } from "@/lib/marketing/search-console";
import { fetchSearchConsoleInsights, SearchConsoleInsightsResult } from "@/lib/marketing/search-console-insights";
import { SITE_THEMES } from "@/lib/site-theme";

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

function BreakdownTable({ title, columnLabel, rows }: { title: string; columnLabel: string; rows: SearchConsoleBreakdownRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h4>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-cream-dim text-xs text-ink-soft">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{columnLabel}</th>
              <th className="px-3 py-2 text-right font-medium">Clicks</th>
              <th className="px-3 py-2 text-right font-medium">Impressions</th>
              <th className="px-3 py-2 text-right font-medium">CTR</th>
              <th className="px-3 py-2 text-right font-medium">Avg. pos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="max-w-xs truncate px-3 py-2 text-ink" title={r.label}>
                  {r.label}
                </td>
                <td className="px-3 py-2 text-right text-ink-soft">{r.clicks}</td>
                <td className="px-3 py-2 text-right text-ink-soft">{r.impressions}</td>
                <td className="px-3 py-2 text-right text-ink-soft">{formatPercent(r.ctr)}</td>
                <td className="px-3 py-2 text-right text-ink-soft">{r.position.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SearchConsolePage() {
  const { venue } = useVenue();
  const config = SEARCH_CONSOLE_CONFIG[venue.slug];
  const siteUrl = SITE_THEMES[venue.slug].siteUrl;
  const [result, setResult] = useState<SearchConsoleResult | null>(null);
  const [loading, setLoading] = useState(Boolean(config));
  const [insights, setInsights] = useState<SearchConsoleInsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting for the new venue before the fetch resolves is intentional here
    setLoading(true);
    setInsights(null);
    fetchSearchConsoleData(venue.slug).then((res) => {
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
    fetchSearchConsoleInsights(venue.slug).then((res) => {
      setInsights(res);
      setInsightsLoading(false);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Search & Visibility"
        subtitle={`How people find ${venue.name} outside social — Google Search performance, site SEO, and where reviews actually come from.`}
        action={
          siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: venue.accent }}
            >
              Visit website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )
        }
      />

      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
            >
              <Search className="h-4 w-4" style={{ color: venue.accent }} />
            </span>
            <h3 className="text-sm font-semibold text-ink">Google Search Console</h3>
          </div>

          {!config ? (
            <IntegrationNote
              text={`No Search Console property connected yet for ${venue.name}. Needs: a Google Cloud service account added as a user on the property (Search Console → Settings → Users and permissions), and the property's exact identifier (e.g. "sc-domain:example.com.au") added to this dashboard's config.`}
            />
          ) : loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Search Console data...
            </div>
          ) : result && !result.ok ? (
            <IntegrationNote
              text={
                result.reason === "not-configured-env"
                  ? "GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY aren't set in this environment yet — add the service account's credentials to .env.local and Vercel to switch this on."
                  : result.message
              }
            />
          ) : result && result.ok ? (
            <>
              <p className="mb-4 text-xs text-ink-soft">
                {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(result.data.startDate))} –{" "}
                {new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(result.data.endDate))}
                {" "}(Google&rsquo;s data typically lags 2-3 days)
              </p>
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiTile icon={MousePointerClick} label="Clicks" value={result.data.totals.clicks.toLocaleString()} accent={venue.accent} />
                <KpiTile icon={Eye} label="Impressions" value={result.data.totals.impressions.toLocaleString()} accent={venue.accent} />
                <KpiTile icon={Percent} label="Avg. CTR" value={formatPercent(result.data.totals.ctr)} accent={venue.accent} />
                <KpiTile icon={ListOrdered} label="Avg. position" value={result.data.totals.position.toFixed(1)} accent={venue.accent} />
              </div>

              <div className="space-y-5">
                <BreakdownTable title="Top search queries" columnLabel="Query" rows={result.data.topQueries} />
                <BreakdownTable title="Top pages" columnLabel="Page" rows={result.data.topPages} />
              </div>
            </>
          ) : null}
        </div>

        {result?.ok && (
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
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
                Reads the numbers above and turns them into specific next steps — which page&rsquo;s title or meta
                description needs work, which queries are worth building content around, that kind of thing.
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

        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
            >
              <Star className="h-4 w-4" style={{ color: venue.accent }} />
            </span>
            <h3 className="text-sm font-semibold text-ink">SEO & reviews — what&rsquo;s already in place</h3>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>
              <span className="font-medium text-ink">Structured data: </span>
              {venue.name}&rsquo;s site carries Restaurant schema (JSON-LD) with address, opening hours, cuisine type and a
              link to the menu — this is what lets Google show rich details in search results, separate from the
              page&rsquo;s own visible text.
            </li>
            <li>
              <span className="font-medium text-ink">Per-page metadata: </span>
              key pages (the menu especially) have their own title, description and social-share (Open Graph) tags
              rather than inheriting one generic site-wide description — this is what shows in the actual search
              result snippet and when a page link is shared.
            </li>
            <li>
              <span className="font-medium text-ink">Where the star rating comes from: </span>
              the rating and review count Google shows next to {venue.name} in search comes from the venue&rsquo;s
              Google Business Profile listing, not from anything built into the website — it&rsquo;s managed
              separately in Google Business Profile by whoever has access to that listing, and isn&rsquo;t something
              this dashboard can pull in without a further, separate connection (the Business Profile API, which
              needs its own verification process).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
