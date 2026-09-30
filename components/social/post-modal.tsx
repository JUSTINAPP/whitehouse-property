"use client";

import { useState } from "react";
import { X, Trash2, Video } from "lucide-react";
import { SocialChannel, SocialPost, SocialStatus, PostFormat, VenueSlug } from "@/lib/types";
import { CHANNEL_COLORS, CHANNEL_LABELS } from "@/lib/mock/social-posts";
import { FORMAT_META } from "@/lib/format-meta";
import { STATUS_META } from "@/lib/status-meta";
import { ImageUploadField } from "@/components/social/image-upload-field";
import { cn } from "@/lib/utils";

const CHANNELS: SocialChannel[] = ["instagram", "facebook", "tiktok", "event", "article"];
const FORMATS: PostFormat[] = ["grid", "carousel", "reel", "story"];
const STATUSES: SocialStatus[] = ["draft", "scheduled", "published", "failed"];

export interface PostDraft {
  channel: SocialChannel;
  format?: PostFormat;
  title: string;
  caption: string;
  contentBrief: string;
  scheduledDate: string;
  scheduledTime: string;
  status: SocialStatus;
  imageUrl: string | null;
  videoUrl: string | null;
}

export function PostModal({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
  accent,
  venueSlug,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: PostDraft) => void;
  onDelete?: () => void;
  initial: Partial<SocialPost> & { scheduledDate: string; scheduledTime: string };
  accent: string;
  venueSlug: VenueSlug;
}) {
  const [draft, setDraft] = useState<PostDraft>({
    channel: initial.channel ?? "instagram",
    format: initial.format,
    title: initial.title ?? "",
    caption: initial.caption ?? "",
    contentBrief: initial.contentBrief ?? "",
    scheduledDate: initial.scheduledDate,
    scheduledTime: initial.scheduledTime,
    status: initial.status ?? "draft",
    imageUrl: initial.imageUrl ?? null,
    videoUrl: initial.videoUrl ?? null,
  });

  if (!open) return null;
  const isEditing = Boolean(initial.id);
  const isVideoFormat = draft.format === "reel";
  const statusMeta = STATUS_META[draft.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">{isEditing ? "Edit post" : "New post"}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-soft hover:bg-cream-dim hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isEditing && (
          <div
            className="flex items-center gap-2 border-b border-border px-6 py-2.5 text-xs font-medium"
            style={{ backgroundColor: statusMeta.bg, color: statusMeta.text }}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            This post is currently <span className="font-semibold">{statusMeta.label.toLowerCase()}</span>
          </div>
        )}

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-2 block text-xs font-medium text-ink-soft">Channel</label>
            <div className="flex gap-2">
              {CHANNELS.map((c) => {
                const colors = CHANNEL_COLORS[c];
                const active = draft.channel === c;
                return (
                  <button
                    key={c}
                    onClick={() => setDraft((d) => ({ ...d, channel: c, format: c === "instagram" ? d.format : undefined }))}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition",
                      active ? "border-transparent" : "border-border text-ink-soft hover:border-ink-soft"
                    )}
                    style={active ? { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border } : undefined}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.dot }} />
                    {CHANNEL_LABELS[c]}
                  </button>
                );
              })}
            </div>
          </div>

          {draft.channel === "instagram" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-ink-soft">Post type</label>
              <div className="flex gap-2">
                {FORMATS.map((f) => {
                  const meta = FORMAT_META[f];
                  const Icon = meta.icon;
                  const active = draft.format === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setDraft((d) => ({ ...d, format: active ? undefined : f, imageUrl: active ? d.imageUrl : null, videoUrl: active ? d.videoUrl : null }))}
                      className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition",
                        active ? "border-transparent text-white" : "border-border text-ink-soft hover:border-ink-soft"
                      )}
                      style={active ? { backgroundColor: meta.color } : undefined}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-soft">Stories are highlighted in amber on the calendar since the client wants these posted daily.</p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Fresh pasta Fridays"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Caption</label>
            <textarea
              value={draft.caption}
              onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
              rows={3}
              placeholder="Write your caption..."
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Brief / creative direction</label>
            <textarea
              value={draft.contentBrief}
              onChange={(e) => setDraft((d) => ({ ...d, contentBrief: e.target.value }))}
              rows={3}
              placeholder="Direction for whoever is shooting or generating the asset — mood, framing, shots to get..."
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
            <p className="mt-1 text-[11px] text-ink-soft">Not shown publicly — for content managers and AI image generators only.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Date</label>
              <input
                type="date"
                value={draft.scheduledDate}
                onChange={(e) => setDraft((d) => ({ ...d, scheduledDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Time</label>
              <input
                type="time"
                value={draft.scheduledTime}
                onChange={(e) => setDraft((d) => ({ ...d, scheduledTime: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              {isVideoFormat ? "Video" : "Image"}
            </label>
            {isVideoFormat ? (
              <div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <Video className="h-4 w-4 shrink-0 text-ink-soft" />
                  <input
                    value={draft.videoUrl ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, videoUrl: e.target.value || null }))}
                    placeholder="https://cdn.shopify.com/... or https://res.cloudinary.com/..."
                    className="w-full text-sm text-ink outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Paste a public video URL — host the file on Shopify CDN, Cloudinary, or similar. Videos aren&apos;t uploaded directly here.
                </p>
              </div>
            ) : (
              <ImageUploadField
                venueSlug={venueSlug}
                imageUrl={draft.imageUrl}
                onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))}
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Status</label>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setDraft((d) => ({ ...d, status: s }))}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition",
                    draft.status === s ? "border-ink bg-ink text-white" : "border-border text-ink-soft hover:border-ink-soft"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {isEditing && onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-soft hover:bg-cream-dim"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              disabled={!draft.title.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              {isEditing ? "Save changes" : "Create post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
