"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { RawContentGrid } from "@/components/social/raw-content-grid";
import { GeneratedContentGallery } from "@/components/social/generated-content-gallery";
import { InstagramEmbed } from "@/components/social/instagram-embed";
import { DRIVE_FOLDERS } from "@/lib/drive-content";
import { SITE_THEMES } from "@/lib/site-theme";
import { INSTAGRAM_MOCK } from "@/lib/instagram-mock";
import { isSupabaseConfigured } from "@/lib/supabase/status";
import { cn } from "@/lib/utils";

type ViewMode = "raw" | "ready" | "live";

export default function ContentPage() {
  const { venue } = useVenue();
  const [view, setView] = useState<ViewMode>("raw");
  const drive = DRIVE_FOLDERS[venue.slug];
  const theme = SITE_THEMES[venue.slug];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Content"
        subtitle={`Raw drops from ${venue.name}, and finished posts ready to schedule or hand off.`}
        action={
          drive ? (
            <a
              href={drive.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
            >
              Open raw folder in Drive
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : undefined
        }
      />

      <div className="mb-5 flex items-center gap-1 rounded-lg border border-border bg-white p-1 w-fit">
        {(
          [
            { id: "raw" as const, label: "Raw Content" },
            { id: "ready" as const, label: "Ready to Post" },
            { id: "live" as const, label: "Live Instagram" },
          ]
        ).map((mode) => (
          <button
            key={mode.id}
            onClick={() => setView(mode.id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition",
              view === mode.id ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
            )}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {view === "raw" &&
        (drive ? (
          <RawContentGrid files={drive.files} />
        ) : (
          <IntegrationNote text={`No Drive folder linked for ${venue.name} yet. Once the venue has a shared intake folder, add it to lib/drive-content.ts.`} />
        ))}

      {view === "ready" &&
        (!isSupabaseConfigured() ? (
          <IntegrationNote text="Supabase isn't configured in this environment yet — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to see generated content here." />
        ) : (
          <GeneratedContentGallery venueSlug={venue.slug} accent={venue.accent} />
        ))}

      {view === "live" && (
        <InstagramEmbed
          handle={theme.instagramHandle}
          embedUrl={theme.instagramEmbedUrl}
          accent={venue.accent}
          mock={INSTAGRAM_MOCK[venue.slug]}
        />
      )}
    </div>
  );
}
