"use client";

import { LucideIcon, TrendingUp, Target, Radar, Mail, Search, MapPin, Sparkles, Megaphone } from "lucide-react";
import { ReactNode } from "react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { KpiTile } from "@/components/ui/kpi-tile";
import { SeasonalityChart } from "@/components/functions/seasonality-chart";
import { getSeasonality, getChannelPerformance, getBreakeven, LABOUR_PCT, COGS_PCT } from "@/lib/mock/function-analytics";

function Card({ title, icon: Icon, accent, children }: { title: string; icon: LucideIcon; accent: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </span>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function FunctionsAnalyticsPage() {
  const { venue } = useVenue();
  const seasonality = getSeasonality(venue.slug);
  const channels = getChannelPerformance(venue.slug);
  const breakeven = getBreakeven(venue.slug);

  const peakMonth = [...seasonality].sort((a, b) => (b.confirmedRevenue + b.pipelineRevenue) - (a.confirmedRevenue + a.pipelineRevenue))[0];
  const totalConfirmedRevenue = seasonality.reduce((s, m) => s + m.confirmedRevenue, 0);
  const totalPipeline = seasonality.reduce((s, m) => s + m.pipelineRevenue, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Functions Seasonality & Channel Analytics"
        subtitle={`How ${venue.name}'s private function bookings move through the year, and what's winning them.`}
      />

      <div className="mb-5">
        <IntegrationNote text="Built from this year's function calendar (mock data). Channel ad spend and CPC are illustrative assumptions — connect Google Ads and Meta Ads Manager to replace them with real spend, and pull actual close data from Sanity.io once enquiry forms write there." />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Confirmed revenue (YTD)" value={`$${totalConfirmedRevenue.toLocaleString()}`} icon={TrendingUp} accent={venue.accent} />
        <KpiTile label="Pipeline value" value={`$${totalPipeline.toLocaleString()}`} icon={Target} accent={venue.accent} />
        <KpiTile label="Peak month" value={peakMonth?.label ?? "—"} icon={Sparkles} accent={venue.accent} />
        <KpiTile label="Breakeven ratio" value={breakeven.breakevenRatio} icon={Radar} accent={venue.accent} trend={breakeven.breakevenRatio < 1 ? "healthy" : "watch"} />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-ink">Bookings by month</h2>
        <p className="mb-4 text-xs text-ink-soft">Confirmed revenue vs. pipeline (tentative + enquiry) still in progress, across the calendar year.</p>
        <SeasonalityChart data={seasonality} accent={venue.accent} />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">Lead source performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-soft">
                <th className="pb-2 pr-4 font-medium">Source</th>
                <th className="pb-2 pr-4 font-medium">Ad spend</th>
                <th className="pb-2 pr-4 font-medium">CPC</th>
                <th className="pb-2 pr-4 font-medium">Leads</th>
                <th className="pb-2 pr-4 font-medium">Close %</th>
                <th className="pb-2 pr-4 font-medium">Bookings</th>
                <th className="pb-2 pr-4 font-medium">Avg value</th>
                <th className="pb-2 pr-4 font-medium">Revenue</th>
                <th className="pb-2 pr-4 font-medium">Gross profit</th>
                <th className="pb-2 font-medium">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.source} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 text-ink">{c.label}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{c.adSpend != null ? `$${c.adSpend.toLocaleString()}` : "—"}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{c.cpc != null ? `$${c.cpc.toFixed(2)}` : "—"}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{c.leads}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{Math.round(c.closeRate * 100)}%</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{c.bookings}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">${c.avgSpend.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 font-medium text-ink">${c.revenue.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">${c.grossProfit.toLocaleString()}</td>
                  <td className="py-2.5 text-ink-soft">{c.roas != null ? `${c.roas}x` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          Gross profit assumes {Math.round(LABOUR_PCT * 100)}% labour + {Math.round(COGS_PCT * 100)}% COGS, matching the breakeven table below.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">Breakeven</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-cream-dim px-4 py-3">
            <p className="text-lg font-semibold text-ink">${breakeven.avgBookingValue.toLocaleString()}</p>
            <p className="text-xs text-ink-soft">Avg. booking value</p>
          </div>
          <div className="rounded-lg bg-cream-dim px-4 py-3">
            <p className="text-lg font-semibold text-ink">${breakeven.grossProfitPerBooking.toLocaleString()}</p>
            <p className="text-xs text-ink-soft">Gross profit / booking</p>
          </div>
          <div className="rounded-lg bg-cream-dim px-4 py-3">
            <p className="text-lg font-semibold text-ink">${breakeven.monthlyMarketingSpend.toLocaleString()}</p>
            <p className="text-xs text-ink-soft">Monthly paid spend</p>
          </div>
          <div className="rounded-lg px-4 py-3" style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 12%, white)` }}>
            <p className="text-lg font-semibold text-ink">{breakeven.breakevenRatio}</p>
            <p className="text-xs text-ink-soft">Bookings&rsquo; GP needed to cover monthly spend</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          A ratio under 1.0 means a single average function&rsquo;s gross profit more than covers a month of paid acquisition spend on Functions.
        </p>
      </div>

      <div className="space-y-5">
        <h2 className="text-base font-semibold text-ink">How to represent this well</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Plan spend around lead time, not the event date" icon={Megaphone} accent={venue.accent}>
            <p className="text-sm leading-relaxed text-ink-soft">
              Function enquiries typically come in 3–8 months before the event. If November and December are the peak
              booking months on the chart above, the marketing spend that wins them needs to land in August–September,
              not November. Use the pipeline bars in the shoulder months (Feb–May) as a leading indicator — if
              pipeline is soft there, it&rsquo;s a signal to push harder well before the next peak, not during it.
            </p>
          </Card>

          <Card title="Capture source at the point of enquiry" icon={Search} accent={venue.accent}>
            <p className="text-sm leading-relaxed text-ink-soft">
              Since Sanity.io is the backend for the enquiry form, add a hidden field that captures UTM parameters
              (or at minimum the referrer) on submission. Without it, every enquiry looks identical downstream and
              this whole channel table has to be rebuilt from guesswork or asking clients how they heard about you.
              This is the single highest-leverage fix available here.
            </p>
          </Card>

          <Card title="Use Search Console for seasonal content timing" icon={Search} accent={venue.accent}>
            <p className="text-sm leading-relaxed text-ink-soft">
              Search Console shows when queries like &ldquo;christmas party venue&rdquo; or &ldquo;wedding venue
              Mornington Peninsula&rdquo; start climbing in impressions — usually weeks before your own booking
              curve moves. Refresh the Functions landing page and push a Google Business post the moment that
              seasonal search interest ticks up, rather than waiting for enquiries to already be flowing.
            </p>
          </Card>

          <Card title="Google Business Profile as a demand signal" icon={MapPin} accent={venue.accent}>
            <p className="text-sm leading-relaxed text-ink-soft">
              GBP Insights (calls, direction requests, &ldquo;request info&rdquo; clicks) is a good early-warning
              indicator for local intent, and it&rsquo;s free. Track it monthly alongside this chart — a rise in GBP
              activity a few weeks before the pipeline bars grow confirms the seasonality pattern rather than it
              being a one-off.
            </p>
          </Card>

          <Card title="Nurture the pipeline, don't just wait on it" icon={Mail} accent={venue.accent}>
            <p className="text-sm leading-relaxed text-ink-soft">
              With enquiry-to-event lead times running months long, a lot of value sits in &ldquo;tentative&rdquo;
              and &ldquo;enquiry&rdquo; status for a while. Resend can run a simple nurture sequence for anyone sitting
              in enquiry status more than ~10 days — a proposal follow-up, then a availability-reminder closer to
              popular dates filling up. Track open/click rates in Resend as a proxy for how warm each lead still is.
            </p>
          </Card>

          <Card title="If you add Google Ads, target the decision window" icon={Target} accent={venue.accent}>
            <p className="text-sm leading-relaxed text-ink-soft">
              Rather than running Functions ads evergreen, ramp spend 6–10 weeks ahead of each peak (based on the
              lead-time data feeding this chart) and pull back hard in the deep off-season (Jun–Aug), where close
              rates are naturally lower. The breakeven ratio above is the number to watch — if it climbs above 1
              during a ramp, the channel table shows exactly which source is dragging it down.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
