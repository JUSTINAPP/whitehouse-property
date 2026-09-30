"use client";

import { useEffect, useState } from "react";
import { X, Mail, Phone, Calendar, DollarSign, Loader2, Check, Plus } from "lucide-react";
import { Guest, GuestHighlight, HighlightType, VisitRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { fetchGuestVisits } from "@/lib/crm/guest-visits";
import { saveGuestStaffNote, saveGuestHighlights } from "@/lib/crm/guests";
import { HIGHLIGHT_TYPE_LABELS, HIGHLIGHT_TYPE_BADGE, HIGHLIGHT_TYPES } from "@/lib/guest-highlight-meta";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

const TAG_VARIANT: Record<string, "gold" | "neutral"> = {
  VIP: "gold",
};

export function GuestProfileDrawer({
  guest,
  onClose,
  accent,
  onNoteSaved,
  onHighlightsSaved,
}: {
  guest: Guest | null;
  onClose: () => void;
  accent: string;
  onNoteSaved?: (guestId: string, staffNotes: string) => void;
  onHighlightsSaved?: (guestId: string, highlights: GuestHighlight[]) => void;
}) {
  const [visitHistory, setVisitHistory] = useState<VisitRecord[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [staffNoteDraft, setStaffNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [highlights, setHighlights] = useState<GuestHighlight[]>([]);
  const [newHighlightType, setNewHighlightType] = useState<HighlightType>("allergy");
  const [newHighlightText, setNewHighlightText] = useState("");
  const [savingHighlights, setSavingHighlights] = useState(false);

  useEffect(() => {
    if (!guest) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching this guest's real visit ledger on open, replacing whatever was shown for the previous guest
    setVisitHistory([]);
    setLoadingVisits(true);
    setStaffNoteDraft(guest.staffNotes ?? "");
    setNoteSaved(false);
    setHighlights(guest.highlights ?? []);
    setNewHighlightText("");
    fetchGuestVisits(guest.id).then((res) => {
      if (cancelled) return;
      if (res.ok) setVisitHistory(res.visits);
      setLoadingVisits(false);
    });
    return () => {
      cancelled = true;
    };
  }, [guest]);

  if (!guest) return null;

  async function handleSaveNote() {
    if (!guest) return;
    setSavingNote(true);
    setNoteSaved(false);
    const res = await saveGuestStaffNote(guest.id, staffNoteDraft);
    setSavingNote(false);
    if (res.ok) {
      setNoteSaved(true);
      onNoteSaved?.(guest.id, staffNoteDraft);
      setTimeout(() => setNoteSaved(false), 2000);
    }
  }

  async function persistHighlights(next: GuestHighlight[]) {
    if (!guest) return;
    setHighlights(next);
    setSavingHighlights(true);
    const res = await saveGuestHighlights(guest.id, next);
    setSavingHighlights(false);
    if (res.ok) onHighlightsSaved?.(guest.id, next);
  }

  function handleAddHighlight() {
    if (!newHighlightText.trim()) return;
    persistHighlights([...highlights, { type: newHighlightType, text: newHighlightText.trim() }]);
    setNewHighlightText("");
  }

  function handleRemoveHighlight(index: number) {
    persistHighlights(highlights.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Guest profile</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-soft hover:bg-cream-dim hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold"
              style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
            >
              {initials(guest.name)}
            </span>
            <div>
              <p className="text-lg font-semibold text-ink">{guest.name}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {guest.tags.map((t) => (
                  <Badge key={t} variant={TAG_VARIANT[t] ?? "neutral"}>
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium text-ink-soft">Highlights</p>
              {savingHighlights && (
                <span className="flex items-center gap-1 text-xs font-medium text-ink-soft">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleRemoveHighlight(i)}
                  title="Click to remove"
                  className="group"
                >
                  <Badge variant={HIGHLIGHT_TYPE_BADGE[h.type]} className="cursor-pointer">
                    {h.text}
                    <X className="ml-1 h-3 w-3 opacity-50 group-hover:opacity-100" />
                  </Badge>
                </button>
              ))}
              {highlights.length === 0 && <p className="text-sm text-ink-soft">No highlights yet.</p>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {HIGHLIGHT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setNewHighlightType(t)}
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                    newHighlightType === t ? "border-transparent text-white" : "border-border bg-white text-ink-soft hover:border-ink-soft"
                  }`}
                  style={newHighlightType === t ? { backgroundColor: accent } : undefined}
                >
                  {HIGHLIGHT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newHighlightText}
                onChange={(e) => setNewHighlightText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddHighlight();
                }}
                placeholder={
                  newHighlightType === "allergy"
                    ? "e.g. Shellfish allergy"
                    : newHighlightType === "seating"
                    ? "e.g. Prefers window table"
                    : newHighlightType === "occasion"
                    ? "e.g. Anniversary – June 12"
                    : newHighlightType === "service"
                    ? "e.g. Had an issue last visit, be attentive"
                    : "e.g. Regular, ask about his boat"
                }
                className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-gold"
              />
              <button
                onClick={handleAddHighlight}
                disabled={!newHighlightText.trim()}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5 text-ink-soft">
              <Mail className="h-4 w-4" /> {guest.email}
            </div>
            <div className="flex items-center gap-2.5 text-ink-soft">
              <Phone className="h-4 w-4" /> {guest.phone}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-lg font-semibold text-ink">{guest.visitCount}</p>
              <p className="text-xs text-ink-soft">Visits</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-lg font-semibold text-ink">{formatCurrency(guest.totalSpend)}</p>
              <p className="text-xs text-ink-soft">Total spend</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-lg font-semibold text-ink">
                {formatCurrency(Math.round(guest.totalSpend / Math.max(guest.visitCount, 1)))}
              </p>
              <p className="text-xs text-ink-soft">Avg / visit</p>
            </div>
          </div>

          {guest.notes && (
            <div className="mt-6">
              <p className="mb-1.5 text-xs font-medium text-ink-soft">From SevenRooms</p>
              <div className="rounded-lg bg-cream-dim/70 p-3 text-sm text-ink-soft">{guest.notes}</div>
            </div>
          )}

          <div className="mt-6">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium text-ink-soft">Staff notes</p>
              {noteSaved && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
            <textarea
              value={staffNoteDraft}
              onChange={(e) => setStaffNoteDraft(e.target.value)}
              placeholder="e.g. allergic to shellfish, prefers window table, regular's birthday in June..."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-white p-3 text-sm text-ink outline-none focus:border-gold"
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote || staffNoteDraft === (guest.staffNotes ?? "")}
              className="mt-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              {savingNote ? "Saving..." : "Save note"}
            </button>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-sm font-semibold text-ink">Visit history</h3>
            {loadingVisits ? (
              <div className="flex items-center gap-2 py-6 text-sm text-ink-soft">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading visit history...
              </div>
            ) : (
              <div className="space-y-3">
                {visitHistory.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink">{formatDate(v.date)}</p>
                        <p className="flex items-center gap-1 text-sm font-medium text-ink">
                          <DollarSign className="h-3.5 w-3.5 text-ink-soft" />
                          {v.spend}
                        </p>
                      </div>
                      <p className="text-xs text-ink-soft">Party of {v.partySize}</p>
                      {v.notes && <p className="mt-1 text-xs text-ink-soft">{v.notes}</p>}
                    </div>
                  </div>
                ))}
                {visitHistory.length === 0 && (
                  <p className="py-4 text-center text-sm text-ink-soft">No visit history on file yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
