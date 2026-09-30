"use client";

import { useState } from "react";
import { X } from "lucide-react";

export interface CampaignDraft {
  subject: string;
  preview: string;
}

export function CampaignModal({
  open,
  onClose,
  onSave,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: CampaignDraft) => void;
  accent: string;
}) {
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");

  if (!open) return null;

  function handleSave() {
    onSave({ subject, preview });
    setSubject("");
    setPreview("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">New campaign</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-soft hover:bg-cream-dim hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Subject line</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Join us for our spring tasting menu"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Preview text</label>
            <textarea
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              rows={3}
              placeholder="A short line shown in the inbox preview..."
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>
          <p className="text-xs text-ink-soft">
            This creates a draft campaign. Sending will be available once your email provider is connected.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-soft hover:bg-cream-dim"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!subject.trim()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            Save draft
          </button>
        </div>
      </div>
    </div>
  );
}
