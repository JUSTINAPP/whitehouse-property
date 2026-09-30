"use client";

import { Quote, Palette, Type, Camera, Crop, Check, Clock, UserCog, LucideIcon, Image as ImageIcon, SlidersHorizontal } from "lucide-react";
import { ReactNode } from "react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { PaletteSwatches } from "@/components/social/palette-swatches";
import { IntegrationNote } from "@/components/ui/integration-note";
import { GUIDELINES } from "@/lib/guidelines-data";
import { SITE_THEMES } from "@/lib/site-theme";
import { PhoneGridPreview } from "@/components/social/phone-grid-preview";

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

export default function GuidelinesPage() {
  const { venue } = useVenue();
  const content = GUIDELINES[venue.slug];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Visual Guidelines"
        subtitle={`Brand system for ${venue.name}'s social content — palette, voice and photography direction.`}
      />

      {!content ? (
        <IntegrationNote text={`No visual guidelines set up yet for ${venue.name} — there's no live website to draw the brand system from. Add one once ${venue.name}'s site or brand assets exist.`} />
      ) : (
        <div className="space-y-5">
          <div
            className="rounded-xl px-6 py-8 text-center"
            style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 10%, white)` }}
          >
            <Quote className="mx-auto mb-2 h-5 w-5" style={{ color: venue.accent }} />
            <p className="text-2xl font-semibold tracking-tight text-ink">&ldquo;{content.tagline}&rdquo;</p>
          </div>

          <Card title="Brand palette" icon={Palette} accent={venue.accent}>
            <PaletteSwatches palette={SITE_THEMES[venue.slug].palette} />
          </Card>

          {SITE_THEMES[venue.slug].exampleImages.length > 0 && (
            <Card title="In practice" icon={ImageIcon} accent={venue.accent}>
              <p className="mb-3 text-sm text-ink-soft">
                Real photography from {venue.name}&rsquo;s own site — this is the light, styling and mood every shot should land near.
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {SITE_THEMES[venue.slug].exampleImages.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="aspect-[4/5] w-full rounded-lg object-cover" />
                ))}
              </div>
            </Card>
          )}

          {SITE_THEMES[venue.slug].instagramHandle && (
            <Card title="In practice — live grid preview" icon={ImageIcon} accent={venue.accent}>
              <p className="mb-4 text-sm text-ink-soft">
                The same idea as the reference grid above, but scrollable and pulling real content — actual
                scheduled/published posts first, topped up with {venue.name}&rsquo;s site photography until it&rsquo;s
                full. A quick way to check the rhythm holds up in an actual feed, not just a mockup.
              </p>
              <PhoneGridPreview venueSlug={venue.slug} accent={venue.accent} venueName={venue.name} />
            </Card>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Device" icon={Type} accent={venue.accent}>
              <p className="text-sm leading-relaxed text-ink-soft">{content.device}</p>
            </Card>
            <Card title="Typography" icon={Type} accent={venue.accent}>
              <p className="text-sm leading-relaxed text-ink-soft">{content.typography}</p>
            </Card>
            <Card title="Photography direction" icon={Camera} accent={venue.accent}>
              <p className="text-sm leading-relaxed text-ink-soft">{content.photography}</p>
            </Card>
            <Card title="Crop ratios" icon={Crop} accent={venue.accent}>
              <p className="text-sm leading-relaxed text-ink-soft">{content.cropRatios}</p>
            </Card>
          </div>

          {content.filterStyle && SITE_THEMES[venue.slug].exampleImages[0] && (
            <Card title="Photography style" icon={SlidersHorizontal} accent={venue.accent}>
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: venue.accent }}
                >
                  {content.filterStyle.name}
                </span>
                <p className="text-sm text-ink-soft">every post gets this treatment before it goes out</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={SITE_THEMES[venue.slug].exampleImages[0]}
                    alt=""
                    className="aspect-[4/5] w-full rounded-lg object-cover"
                  />
                  <p className="mt-1.5 text-center text-[11px] uppercase tracking-wide text-ink-soft">Straight out of camera</p>
                </div>
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={SITE_THEMES[venue.slug].exampleImages[0]}
                    alt=""
                    className="aspect-[4/5] w-full rounded-lg object-cover"
                    style={{ filter: content.filterStyle.cssFilter }}
                  />
                  <p className="mt-1.5 text-center text-[11px] font-medium uppercase tracking-wide" style={{ color: venue.accent }}>
                    {content.filterStyle.name}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{content.filterStyle.recipe}</p>
            </Card>
          )}

          <Card title="Caption voice" icon={Quote} accent={venue.accent}>
            {content.voiceNotes.map((n, i) => (
              <p key={i} className="mb-2 text-sm text-ink-soft">{n}</p>
            ))}
            <div className="mt-3 space-y-2">
              {content.exampleCaptions.map((c, i) => (
                <p key={i} className="rounded-lg bg-cream-dim px-3 py-2 text-sm italic text-ink">&ldquo;{c}&rdquo;</p>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 md:grid-cols-3">
            <Card title="We do end-to-end" icon={Check} accent={venue.accent}>
              <ul className="space-y-1.5">
                {content.editingCapability.weDoEndToEnd.map((t) => (
                  <li key={t} className="text-sm text-ink-soft">• {t}</li>
                ))}
              </ul>
            </Card>
            <Card title="We do, with a limit" icon={Clock} accent={venue.accent}>
              <ul className="space-y-1.5">
                {content.editingCapability.weDoWithLimit.map((t) => (
                  <li key={t} className="text-sm text-ink-soft">• {t}</li>
                ))}
              </ul>
            </Card>
            <Card title="Needs the venue" icon={UserCog} accent={venue.accent}>
              <ul className="space-y-1.5">
                {content.editingCapability.needsVenue.map((t) => (
                  <li key={t} className="text-sm text-ink-soft">• {t}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
