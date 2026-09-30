"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { CampaignCard } from "@/components/marketing/campaign-card";
import { CampaignModal, CampaignDraft } from "@/components/marketing/campaign-modal";
import { getCampaigns } from "@/lib/mock/campaigns";
import { EmailCampaign, VenueSlug } from "@/lib/types";
import { TODAY_ISO } from "@/lib/mock/dates";

export default function MarketingPage() {
  const { venue } = useVenue();
  const [draftsByVenue, setDraftsByVenue] = useState<Record<VenueSlug, EmailCampaign[]>>({
    "beach-road": [],
    barrys: [],
    tilbury: [],
    vicar: [],
  });
  const [modalOpen, setModalOpen] = useState(false);

  const sentCampaigns = getCampaigns(venue.slug);
  const drafts = draftsByVenue[venue.slug];
  const campaigns = [...drafts, ...sentCampaigns];

  const avgOpenRate = Math.round(
    (sentCampaigns.reduce((s, c) => s + c.openRate, 0) / sentCampaigns.length) * 10
  ) / 10;
  const avgClickRate = Math.round(
    (sentCampaigns.reduce((s, c) => s + c.clickRate, 0) / sentCampaigns.length) * 10
  ) / 10;
  const totalRecipients = sentCampaigns.reduce((s, c) => s + c.recipients, 0);

  function handleSave(draft: CampaignDraft) {
    const newCampaign: EmailCampaign = {
      id: `${venue.slug}-draft-${Date.now()}`,
      venueId: venue.slug,
      subject: draft.subject,
      preview: draft.preview,
      sentDate: TODAY_ISO,
      recipients: 0,
      openRate: 0,
      clickRate: 0,
      status: "draft",
    };
    setDraftsByVenue((prev) => ({ ...prev, [venue.slug]: [newCampaign, ...prev[venue.slug]] }));
    setModalOpen(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Email Marketing"
        subtitle={`Campaign performance for ${venue.name}.`}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: venue.accent }}
          >
            <Plus className="h-4 w-4" />
            New campaign
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-2xl font-semibold text-ink">{avgOpenRate}%</p>
          <p className="mt-1 text-sm text-ink-soft">Average open rate</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-2xl font-semibold text-ink">{avgClickRate}%</p>
          <p className="mt-1 text-sm text-ink-soft">Average click rate</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-2xl font-semibold text-ink">{totalRecipients.toLocaleString()}</p>
          <p className="mt-1 text-sm text-ink-soft">Total recipients reached</p>
        </div>
      </div>

      <div className="space-y-4">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} accent={venue.accent} />
        ))}
      </div>

      <CampaignModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} accent={venue.accent} />
    </div>
  );
}
