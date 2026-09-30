import { Mail } from "lucide-react";
import { EmailCampaign } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function CampaignCard({ campaign, accent }: { campaign: EmailCampaign; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)` }}
          >
            <Mail className="h-[18px] w-[18px]" style={{ color: accent }} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{campaign.subject}</p>
            <p className="mt-0.5 text-xs text-ink-soft">{campaign.preview}</p>
          </div>
        </div>
        <Badge variant={campaign.status === "sent" ? "published" : "draft"}>{campaign.status}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3 border-t border-border pt-4 text-center">
        <div>
          <p className="text-sm font-semibold text-ink">{campaign.recipients.toLocaleString()}</p>
          <p className="text-[11px] text-ink-soft">Recipients</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{campaign.openRate}%</p>
          <p className="text-[11px] text-ink-soft">Open rate</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{campaign.clickRate}%</p>
          <p className="text-[11px] text-ink-soft">Click rate</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{formatDate(campaign.sentDate)}</p>
          <p className="text-[11px] text-ink-soft">Sent</p>
        </div>
      </div>
    </div>
  );
}
