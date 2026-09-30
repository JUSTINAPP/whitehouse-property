"use client";

import { useEffect, useState } from "react";
import { Sparkles, Plus, Trash2, Copy, Loader2, RefreshCw, Pencil, Check, X } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { IntegrationNote } from "@/components/ui/integration-note";
import { GUIDELINES } from "@/lib/guidelines-data";
import {
  ContentIdea,
  ContentPillar,
  addIdea,
  addPillar,
  deleteIdea,
  deletePillar,
  fetchIdeasBoard,
  renamePillar,
  replacePillars,
} from "@/lib/social/ideas-data";
import { isSupabaseConfigured } from "@/lib/supabase/status";
import { cn } from "@/lib/utils";

function defaultBrandDescription(venueSlug: string, venueName: string, venueType: string): string {
  const g = GUIDELINES[venueSlug as keyof typeof GUIDELINES];
  if (!g) return `${venueName}, a ${venueType}.`;
  return `${venueName}, a ${venueType}. ${g.tagline}. ${g.photography}`;
}

export default function IdeasPage() {
  const { venue } = useVenue();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [brandDescription, setBrandDescription] = useState("");
  const [generatingPillars, setGeneratingPillars] = useState(false);
  const [generatingPillarId, setGeneratingPillarId] = useState<string | null>(null);
  const [draftByPillar, setDraftByPillar] = useState<Record<string, string>>({});
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [addingPillar, setAddingPillar] = useState(false);
  const [newPillarTitle, setNewPillarTitle] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the draft description and loading state for the new venue before the fetch resolves is intentional here
    setBrandDescription(defaultBrandDescription(venue.slug, venue.name, venue.type));
    let cancelled = false;
    setLoading(true);
    fetchIdeasBoard(venue.slug).then((board) => {
      if (cancelled) return;
      setPillars(board?.pillars ?? []);
      setIdeas(board?.ideas ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug, venue.name, venue.type]);

  async function handleGeneratePillars(regenerate: boolean) {
    setGeneratingPillars(true);
    try {
      const res = await fetch("/api/social/ideas/pillars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venue: venue.slug, brandDescription }),
      });
      const body = await res.json();
      if (!res.ok) {
        showToast(body.error ?? "Couldn't generate ideas right now.", "error");
        return;
      }
      const saved = await replacePillars(venue.slug, body.pillars);
      if (!saved) {
        showToast("Generated pillars, but couldn't save them — check your connection.", "error");
        return;
      }
      setPillars(saved);
      setIdeas([]);
      showToast(regenerate ? "Pillars regenerated" : "Pillars generated — now generate ideas for each one");
    } catch {
      showToast("Couldn't generate ideas right now.", "error");
    } finally {
      setGeneratingPillars(false);
    }
  }

  async function handleGenerateIdeas(pillar: ContentPillar) {
    setGeneratingPillarId(pillar.id);
    try {
      const existingIdeas = ideas.filter((i) => i.pillarId === pillar.id).map((i) => i.body);
      const res = await fetch("/api/social/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue: venue.slug,
          pillarTitle: pillar.title,
          pillarDescription: pillar.description,
          existingIdeas,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        showToast(body.error ?? "Couldn't generate ideas for this pillar.", "error");
        return;
      }
      const newIdeas: ContentIdea[] = [];
      let position = existingIdeas.length;
      for (const text of body.ideas as string[]) {
        const saved = await addIdea(venue.slug, pillar.id, text, "ai", position++);
        if (saved) newIdeas.push(saved);
      }
      setIdeas((prev) => [...prev, ...newIdeas]);
      if (newIdeas.length === 0) {
        showToast("Generated ideas, but couldn't save them — check your connection.", "error");
      }
    } catch {
      showToast("Couldn't generate ideas for this pillar.", "error");
    } finally {
      setGeneratingPillarId(null);
    }
  }

  async function handleAddOwnIdea(pillar: ContentPillar) {
    const text = (draftByPillar[pillar.id] ?? "").trim();
    if (!text) return;
    const position = ideas.filter((i) => i.pillarId === pillar.id).length;
    const saved = await addIdea(venue.slug, pillar.id, text, "manual", position);
    if (saved) {
      setIdeas((prev) => [...prev, saved]);
      setDraftByPillar((prev) => ({ ...prev, [pillar.id]: "" }));
    } else {
      showToast("Couldn't save that idea — check your connection.", "error");
    }
  }

  async function handleDeleteIdea(idea: ContentIdea) {
    const previous = ideas;
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    const ok = await deleteIdea(idea.id);
    if (!ok) {
      setIdeas(previous);
      showToast("Couldn't delete that idea — check your connection.", "error");
    }
  }

  async function handleCopyIdea(idea: ContentIdea) {
    try {
      await navigator.clipboard.writeText(idea.body);
      showToast("Idea copied");
    } catch {
      showToast("Couldn't copy to clipboard.", "error");
    }
  }

  async function handleRenamePillar(pillar: ContentPillar) {
    const title = editingTitle.trim();
    setEditingPillarId(null);
    if (!title || title === pillar.title) return;
    const previous = pillars;
    setPillars((prev) => prev.map((p) => (p.id === pillar.id ? { ...p, title } : p)));
    const ok = await renamePillar(pillar.id, title);
    if (!ok) {
      setPillars(previous);
      showToast("Couldn't rename that pillar — check your connection.", "error");
    }
  }

  async function handleDeletePillar(pillar: ContentPillar) {
    const previousPillars = pillars;
    const previousIdeas = ideas;
    setPillars((prev) => prev.filter((p) => p.id !== pillar.id));
    setIdeas((prev) => prev.filter((i) => i.pillarId !== pillar.id));
    const ok = await deletePillar(pillar.id);
    if (!ok) {
      setPillars(previousPillars);
      setIdeas(previousIdeas);
      showToast("Couldn't delete that pillar — check your connection.", "error");
    }
  }

  async function handleAddPillar() {
    const title = newPillarTitle.trim();
    if (!title) return;
    const saved = await addPillar(venue.slug, title, pillars.length);
    if (saved) {
      setPillars((prev) => [...prev, saved]);
      setNewPillarTitle("");
      setAddingPillar(false);
    } else {
      showToast("Couldn't add that pillar — check your connection.", "error");
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <PageHeader title="Ideas" subtitle="Content pillars and AI-generated post ideas for the week." />
        <IntegrationNote text="Ideas needs Supabase configured to save pillars and ideas — not set up in this environment yet." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Ideas"
        subtitle="Content pillars and AI-generated post ideas — brainstorm here, then build the winners into the calendar."
        action={
          pillars.length > 0 && (
            <button
              onClick={() => handleGeneratePillars(true)}
              disabled={generatingPillars}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-cream-dim disabled:opacity-50"
            >
              {generatingPillars ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate pillars
            </button>
          )
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your Ideas board...
        </div>
      ) : pillars.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
            >
              <Sparkles className="h-4.5 w-4.5" style={{ color: venue.accent }} />
            </span>
            <h2 className="text-lg font-semibold text-ink">Generate content ideas with AI</h2>
          </div>
          <p className="mb-4 text-sm text-ink-soft">
            Spend less time brainstorming and more time creating. We&rsquo;ll read {venue.name}&rsquo;s brand voice and
            generate content pillars first — recurring themes you can then get post ideas for, one column at a time.
          </p>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Brand description
          </label>
          <textarea
            value={brandDescription}
            onChange={(e) => setBrandDescription(e.target.value)}
            rows={3}
            className="mb-4 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:border-ink-soft focus:outline-none"
          />
          <button
            onClick={() => handleGeneratePillars(false)}
            disabled={generatingPillars}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ backgroundColor: venue.accent }}
          >
            {generatingPillars ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate ideas
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pillars.map((pillar) => {
            const pillarIdeas = ideas.filter((i) => i.pillarId === pillar.id);
            return (
              <div key={pillar.id} className="w-72 shrink-0 rounded-xl border border-border bg-cream-dim/50">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-3">
                  {editingPillarId === pillar.id ? (
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenamePillar(pillar)}
                        className="min-w-0 flex-1 rounded-md border border-border px-2 py-1 text-sm text-ink focus:outline-none"
                      />
                      <button onClick={() => handleRenamePillar(pillar)} className="rounded p-1 text-ink-soft hover:bg-white">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingPillarId(null)} className="rounded p-1 text-ink-soft hover:bg-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="truncate text-sm font-semibold text-ink" title={pillar.description ?? undefined}>
                        {pillar.title}
                      </h3>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() => {
                            setEditingPillarId(pillar.id);
                            setEditingTitle(pillar.title);
                          }}
                          className="rounded p-1 text-ink-soft/60 hover:bg-white hover:text-ink-soft"
                          title="Rename"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePillar(pillar)}
                          className="rounded p-1 text-ink-soft/60 hover:bg-white hover:text-red-600"
                          title="Delete pillar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2 p-2.5">
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-2">
                    <input
                      value={draftByPillar[pillar.id] ?? ""}
                      onChange={(e) => setDraftByPillar((prev) => ({ ...prev, [pillar.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleAddOwnIdea(pillar)}
                      placeholder="Add your own idea"
                      className="min-w-0 flex-1 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddOwnIdea(pillar)}
                      className="shrink-0 rounded p-0.5 text-ink-soft hover:text-ink"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleGenerateIdeas(pillar)}
                    disabled={generatingPillarId === pillar.id}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm font-medium transition disabled:opacity-60"
                    style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 12%, white)`, color: venue.accent }}
                  >
                    <span>Generate new ideas</span>
                    {generatingPillarId === pillar.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {pillarIdeas.map((idea) => (
                    <div key={idea.id} className="rounded-lg border border-border bg-white p-3 shadow-sm">
                      <p className="text-[13px] leading-relaxed text-ink">{idea.body}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          onClick={() => handleDeleteIdea(idea)}
                          className="rounded p-1 text-ink-soft/50 hover:text-red-600"
                          title="Delete idea"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyIdea(idea)}
                          className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-ink-soft hover:text-ink"
                        >
                          <Copy className="h-3 w-3" />
                          Copy idea
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="w-64 shrink-0">
            {addingPillar ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-3">
                <input
                  autoFocus
                  value={newPillarTitle}
                  onChange={(e) => setNewPillarTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPillar()}
                  placeholder="Pillar name"
                  className="mb-2 w-full rounded-md border border-border px-2 py-1.5 text-sm text-ink focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddPillar}
                    className="flex-1 rounded-md py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: venue.accent }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setAddingPillar(false);
                      setNewPillarTitle("");
                    }}
                    className="flex-1 rounded-md border border-border py-1.5 text-xs font-medium text-ink-soft"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingPillar(true)}
                className={cn(
                  "flex h-full min-h-[88px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-sm font-medium text-ink-soft transition hover:bg-cream-dim"
                )}
              >
                <Plus className="h-4 w-4" />
                Add pillar
              </button>
            )}
          </div>
        </div>
      )}

      <ToastViewport toast={toast} />
    </div>
  );
}
