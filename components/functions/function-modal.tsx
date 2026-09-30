"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { FunctionBooking, FunctionEventType, FunctionStatus, LeadSource } from "@/lib/types";
import { FUNCTION_STATUS_COLORS, FUNCTION_STATUS_LABELS } from "@/lib/function-status-meta";
import { SOURCE_LABELS } from "@/lib/mock/function-analytics";
import { cn } from "@/lib/utils";

const EVENT_TYPES: FunctionEventType[] = ["Wedding", "Engagement", "Birthday", "Corporate", "Christmas Party", "Wake", "Christening", "Other"];
const STATUSES: FunctionStatus[] = ["enquiry", "tentative", "confirmed", "cancelled"];
const SOURCES: LeadSource[] = ["google-ads", "instagram-ads", "google-organic", "instagram-organic", "google-business", "referral", "repeat-guest", "website-direct"];

export interface FunctionDraft {
  clientName: string;
  clientEmail: string;
  eventType: FunctionEventType;
  eventDate: string;
  startTime: string;
  guestCount: number;
  space: string;
  avgSpendPerHead: number;
  depositPaid: number;
  status: FunctionStatus;
  leadSource: LeadSource;
  enquiryDate: string;
  notes?: string;
}

export function FunctionModal({
  open,
  onClose,
  onSave,
  onDelete,
  initial,
  accent,
  spaces,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (draft: FunctionDraft) => void;
  onDelete?: () => void;
  initial: Partial<FunctionBooking> & { eventDate: string };
  accent: string;
  spaces: string[];
}) {
  const [draft, setDraft] = useState<FunctionDraft>({
    clientName: initial.clientName ?? "",
    clientEmail: initial.clientEmail ?? "",
    eventType: initial.eventType ?? "Birthday",
    eventDate: initial.eventDate,
    startTime: initial.startTime ?? "18:30",
    guestCount: initial.guestCount ?? 40,
    space: initial.space ?? spaces[0],
    avgSpendPerHead: initial.avgSpendPerHead ?? 100,
    depositPaid: initial.depositPaid ?? 0,
    status: initial.status ?? "enquiry",
    leadSource: initial.leadSource ?? "google-organic",
    enquiryDate: initial.enquiryDate ?? initial.eventDate,
    notes: initial.notes ?? "",
  });

  if (!open) return null;
  const isEditing = Boolean(initial.id);
  const totalValue = draft.guestCount * draft.avgSpendPerHead;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">{isEditing ? "Edit function" : "New function enquiry"}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-soft hover:bg-cream-dim hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Client name</label>
              <input
                value={draft.clientName}
                onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))}
                placeholder="e.g. Olivia Bennett"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Client email</label>
              <input
                value={draft.clientEmail}
                onChange={(e) => setDraft((d) => ({ ...d, clientEmail: e.target.value }))}
                placeholder="olivia@example.com"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-ink-soft">Event type</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setDraft((d) => ({ ...d, eventType: t }))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    draft.eventType === t ? "border-transparent text-white" : "border-border text-ink-soft hover:border-ink-soft"
                  )}
                  style={draft.eventType === t ? { backgroundColor: accent } : undefined}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Event date</label>
              <input
                type="date"
                value={draft.eventDate}
                onChange={(e) => setDraft((d) => ({ ...d, eventDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Start time</label>
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Guests</label>
              <input
                type="number"
                min={1}
                value={draft.guestCount}
                onChange={(e) => setDraft((d) => ({ ...d, guestCount: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Space</label>
              <select
                value={draft.space}
                onChange={(e) => setDraft((d) => ({ ...d, space: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              >
                {spaces.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Spend / head ($)</label>
              <input
                type="number"
                min={0}
                value={draft.avgSpendPerHead}
                onChange={(e) => setDraft((d) => ({ ...d, avgSpendPerHead: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="rounded-lg bg-cream-dim px-3 py-2 text-sm text-ink">
            Estimated value: <span className="font-semibold">${totalValue.toLocaleString()}</span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Deposit paid ($)</label>
            <input
              type="number"
              min={0}
              value={draft.depositPaid}
              onChange={(e) => setDraft((d) => ({ ...d, depositPaid: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-ink-soft">Status</label>
            <div className="flex gap-2">
              {STATUSES.map((s) => {
                const colors = FUNCTION_STATUS_COLORS[s];
                const active = draft.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setDraft((d) => ({ ...d, status: s }))}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
                      active ? "border-transparent" : "border-border text-ink-soft hover:border-ink-soft"
                    )}
                    style={active ? { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border } : undefined}
                  >
                    {FUNCTION_STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Lead source</label>
              <select
                value={draft.leadSource}
                onChange={(e) => setDraft((d) => ({ ...d, leadSource: e.target.value as LeadSource }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Enquiry date</label>
              <input
                type="date"
                value={draft.enquiryDate}
                onChange={(e) => setDraft((d) => ({ ...d, enquiryDate: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={2}
              placeholder="Dietary requirements, AV needs, run sheet notes..."
              className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
            />
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
              disabled={!draft.clientName.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              {isEditing ? "Save changes" : "Create booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
