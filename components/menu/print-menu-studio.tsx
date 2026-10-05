"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { IntegrationNote } from "@/components/ui/integration-note";
import { VENUE_PIECES } from "@/lib/menu-print/pieces";
import { fetchPieceDoc, getSeedDoc, savePieceDoc } from "@/lib/menu-print/data";
import type { PieceDef, PrintItem, PrintPage, PrintPieceDoc, PrintSection } from "@/lib/menu-print/types";
import type { VenueSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-md border border-border bg-white px-2 py-1 text-[13px] text-ink placeholder:text-ink-soft/60 focus:border-ink-soft focus:outline-none";
const iconBtn = "rounded p-1 text-ink-soft hover:bg-black/5 hover:text-ink disabled:opacity-30";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

function move<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return;
  const [x] = arr.splice(from, 1);
  arr.splice(to, 0, x);
}

export function PrintMenuStudio() {
  const { venue } = useVenue();
  const pieces = VENUE_PIECES[venue.slug];
  // Remember which piece was picked *for which venue*, so switching venue
  // falls back to that venue's first piece without needing an effect.
  const [selection, setSelection] = useState<{ venue: VenueSlug; key: string } | null>(null);
  const pieceKey = selection?.venue === venue.slug ? selection.key : null;

  if (!pieces || pieces.length === 0) {
    return (
      <IntegrationNote
        text={`${venue.name} doesn't have print menus set up yet. Each venue prints different pieces (different sizes, page counts and artwork), so they're set up one venue at a time — send over ${venue.shortName}'s menu files and they'll appear here.`}
      />
    );
  }

  const active = pieces.find((p) => p.key === pieceKey) ?? pieces[0];

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {pieces.map((p) => (
          <button
            key={p.key}
            onClick={() => setSelection({ venue: venue.slug, key: p.key })}
            className={cn(
              "rounded-lg border px-3 py-2 text-left transition",
              p.key === active.key ? "border-ink bg-ink text-white" : "border-border bg-white text-ink hover:border-ink-soft"
            )}
          >
            <span className="block text-sm font-medium">{p.label}</span>
            <span className={cn("block text-[11px]", p.key === active.key ? "text-white/70" : "text-ink-soft")}>{p.description}</span>
          </button>
        ))}
      </div>
      <PieceEditor key={`${venue.slug}:${active.key}`} venueSlug={venue.slug} def={active} />
    </div>
  );
}

function PieceEditor({ venueSlug, def }: { venueSlug: VenueSlug; def: PieceDef }) {
  const [doc, setDoc] = useState<PrintPieceDoc | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pageIdx, setPageIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [buildError, setBuildError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPieceDoc(venueSlug, def.key).then((res) => {
      if (cancelled || !res) return;
      setDoc(res.doc);
      setSaved(res.saved);
    });
    return () => {
      cancelled = true;
    };
  }, [venueSlug, def.key]);

  // Rebuild the PDF preview shortly after the last edit.
  useEffect(() => {
    if (!doc) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setBuilding(true);
      try {
        const res = await fetch("/api/menu-print/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueSlug, pieceKey: def.key, doc }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setBuildError(body?.error ?? "Couldn't build the preview.");
          return;
        }
        setBuildError(null);
        try {
          setWarnings(JSON.parse(decodeURIComponent(res.headers.get("X-Menu-Warnings") ?? "[]")));
        } catch {
          setWarnings([]);
        }
        const url = URL.createObjectURL(await res.blob());
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = url;
        setPreviewUrl(url);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setBuildError("Couldn't reach the server to build the preview.");
      } finally {
        if (!controller.signal.aborted) setBuilding(false);
      }
    }, 600);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [doc, venueSlug, def.key]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  const mutate = useCallback((fn: (d: PrintPieceDoc) => void) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = clone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
    setMessage(null);
  }, []);

  async function handleSave() {
    if (!doc) return;
    setSaving(true);
    const ok = await savePieceDoc(venueSlug, def.key, doc);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setDirty(false);
      setMessage("Saved.");
    } else {
      setMessage("Couldn't save — check the connection and try again.");
    }
  }

  async function handleDownload() {
    if (!doc) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/menu-print/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueSlug, pieceKey: def.key, doc, download: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(body?.error ?? "Couldn't build the PDF — try again.");
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `${venueSlug}-${def.key}-menu.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function handleReset() {
    if (!window.confirm("Reset this menu to its original starting content? Your unsaved edits will be lost (saved edits stay until you save again).")) return;
    const seed = getSeedDoc(venueSlug, def.key);
    if (seed) {
      setDoc(seed);
      setDirty(true);
      setPageIdx(0);
    }
  }

  if (!doc) return <p className="text-sm text-ink-soft">Loading…</p>;

  const page = doc.pages[Math.min(pageIdx, doc.pages.length - 1)];
  const pi = doc.pages.indexOf(page);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Editor */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink hover:border-ink-soft disabled:opacity-50"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download print PDF
          </button>
          <button onClick={handleReset} className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-ink-soft hover:text-ink">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to original
          </button>
          <span className="text-xs text-ink-soft">{message ?? (dirty ? "Unsaved changes" : saved ? "All changes saved" : "Showing the original content — not saved yet")}</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {doc.pages.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setPageIdx(i)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                i === pi ? "border-ink bg-ink text-white" : "border-border bg-white text-ink-soft hover:text-ink"
              )}
            >
              {i + 1}. {p.label}
              {p.kind === "art" ? " · art" : ""}
            </button>
          ))}
        </div>

        <PageEditor page={page} pageIndex={pi} mutate={mutate} />
      </div>

      {/* Live PDF preview — the real export, rebuilt after each edit */}
      <div className="min-w-0">
        <div className="sticky top-4">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-soft">
            <span>Live preview — this is the actual print PDF</span>
            {building && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> updating
              </span>
            )}
          </div>
          {warnings.length > 0 && (
            <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          )}
          {buildError && <p className="mb-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{buildError}</p>}
          <div className="overflow-hidden rounded-xl border border-border bg-neutral-100" style={{ height: "min(82vh, 900px)" }}>
            {previewUrl ? (
              <iframe key={`${previewUrl}-${pi}`} title="Menu preview" src={`${previewUrl}#page=${pi + 1}&toolbar=0&navpanes=0&view=FitH`} className="h-full w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-soft">Building preview…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageEditor({ page, pageIndex, mutate }: { page: PrintPage; pageIndex: number; mutate: (fn: (d: PrintPieceDoc) => void) => void }) {
  const setPage = (fn: (p: PrintPage) => void) => mutate((d) => fn(d.pages[pageIndex]));

  if (page.kind === "art") {
    return (
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-ink-soft">
        <p className="font-medium text-ink">{page.label}</p>
        <p className="mt-1">This is a printed artwork page (cover / back), so there&apos;s no text to edit here. It still prints as part of the PDF.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft">Page text</p>
        <div className="grid gap-2">
          {page.title !== undefined && (
            <label className="block text-xs text-ink-soft">
              Heading block (one line per row)
              <textarea rows={3} className={cn(inputCls, "mt-1")} value={page.title} onChange={(e) => setPage((p) => (p.title = e.target.value))} />
            </label>
          )}
          {page.titleNote !== undefined && (
            <label className="block text-xs text-ink-soft">
              Small line under the heading
              <input className={cn(inputCls, "mt-1")} value={page.titleNote} onChange={(e) => setPage((p) => (p.titleNote = e.target.value))} />
            </label>
          )}
          <label className="block text-xs text-ink-soft">
            Small print at the foot of the page
            <textarea rows={3} className={cn(inputCls, "mt-1")} value={page.footer ?? ""} onChange={(e) => setPage((p) => (p.footer = e.target.value))} />
          </label>
          <label className="block text-xs text-ink-soft">
            Spacing between items ({(page.spacing ?? 1).toFixed(1)}×)
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.1}
              value={page.spacing ?? 1}
              onChange={(e) => setPage((p) => (p.spacing = Number(e.target.value)))}
              className="mt-1 w-full"
            />
          </label>
        </div>
      </div>

      {page.sections.map((section, si) => (
        <SectionEditor key={section.key} section={section} index={si} count={page.sections.length} pageIndex={pageIndex} mutate={mutate} />
      ))}

      <button
        onClick={() =>
          mutate((d) => {
            d.pages[pageIndex].sections.push({ key: uid("s"), title: "new section", items: [] });
          })
        }
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-ink-soft hover:border-ink-soft hover:text-ink"
      >
        <Plus className="h-4 w-4" />
        Add section
      </button>
    </div>
  );
}

function SectionEditor({
  section,
  index,
  count,
  pageIndex,
  mutate,
}: {
  section: PrintSection;
  index: number;
  count: number;
  pageIndex: number;
  mutate: (fn: (d: PrintPieceDoc) => void) => void;
}) {
  const setSection = (fn: (s: PrintSection) => void) => mutate((d) => fn(d.pages[pageIndex].sections[index]));

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <input className={cn(inputCls, "flex-1 text-sm font-medium")} value={section.title} onChange={(e) => setSection((s) => (s.title = e.target.value))} placeholder="Section title" />
        <button className={iconBtn} disabled={index === 0} onClick={() => mutate((d) => move(d.pages[pageIndex].sections, index, index - 1))} title="Move section up">
          <ArrowUp className="h-4 w-4" />
        </button>
        <button className={iconBtn} disabled={index === count - 1} onClick={() => mutate((d) => move(d.pages[pageIndex].sections, index, index + 1))} title="Move section down">
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          className={cn(iconBtn, "text-rose-500 hover:text-rose-600")}
          onClick={() => window.confirm(`Delete the "${section.title}" section and its items?`) && mutate((d) => d.pages[pageIndex].sections.splice(index, 1))}
          title="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <input className={inputCls} value={section.subtitle ?? ""} onChange={(e) => setSection((s) => (s.subtitle = e.target.value || undefined))} placeholder="Intro line under the title (optional)" />
        <input
          className={inputCls}
          value={section.note ?? ""}
          onChange={(e) => setSection((s) => (s.note = e.target.value || undefined))}
          placeholder="Trailing note (ALL CAPS = centred call-out)"
        />
        <input
          key={(section.priceColumns ?? []).join(",")}
          className={cn(inputCls, "sm:col-span-2")}
          defaultValue={(section.priceColumns ?? []).join(", ")}
          onBlur={(e) => {
            const cols = e.target.value.split(",").map((c) => c.trim()).filter(Boolean);
            setSection((s) => (s.priceColumns = cols.length ? cols : undefined));
          }}
          placeholder="Price column headings, e.g. 150ml, 250ml, BTL (optional — then prices are entered like 12/20/52)"
        />
      </div>

      <div className="space-y-2">
        {section.items.map((item, ii) => (
          <ItemEditor key={item.key} item={item} index={ii} count={section.items.length} sectionIndex={index} pageIndex={pageIndex} mutate={mutate} />
        ))}
      </div>

      <button
        onClick={() =>
          mutate((d) => {
            d.pages[pageIndex].sections[index].items.push({ key: uid("i"), name: "NEW ITEM", description: "", price: "", dietary: [] });
          })
        }
        className="mt-3 flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
      >
        <Plus className="h-3.5 w-3.5" />
        Add item
      </button>
    </div>
  );
}

function ItemEditor({
  item,
  index,
  count,
  sectionIndex,
  pageIndex,
  mutate,
}: {
  item: PrintItem;
  index: number;
  count: number;
  sectionIndex: number;
  pageIndex: number;
  mutate: (fn: (d: PrintPieceDoc) => void) => void;
}) {
  const setItem = (fn: (i: PrintItem) => void) => mutate((d) => fn(d.pages[pageIndex].sections[sectionIndex].items[index]));
  const items = (d: PrintPieceDoc) => d.pages[pageIndex].sections[sectionIndex].items;

  return (
    <div className="rounded-lg border border-border/70 bg-neutral-50/60 p-2">
      <div className="flex items-center gap-2">
        <input className={cn(inputCls, "flex-1 font-medium")} value={item.name} onChange={(e) => setItem((i) => (i.name = e.target.value))} placeholder="Item name" />
        <input className={cn(inputCls, "w-28 shrink-0")} value={item.price} onChange={(e) => setItem((i) => (i.price = e.target.value))} placeholder="Price" />
        <button className={iconBtn} disabled={index === 0} onClick={() => mutate((d) => move(items(d), index, index - 1))} title="Move up">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button className={iconBtn} disabled={index === count - 1} onClick={() => mutate((d) => move(items(d), index, index + 1))} title="Move down">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button className={cn(iconBtn, "text-rose-500 hover:text-rose-600")} onClick={() => mutate((d) => items(d).splice(index, 1))} title="Delete item">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        rows={2}
        className={cn(inputCls, "mt-1.5")}
        value={item.description}
        onChange={(e) => setItem((i) => (i.description = e.target.value))}
        placeholder="Description (optional) — wrap text in **double asterisks** to make it heavier; +5 style add-ons are heavier automatically"
      />
      <div className="mt-1.5 grid gap-1.5 sm:grid-cols-[1fr_9rem]">
        <input className={inputCls} value={item.note ?? ""} onChange={(e) => setItem((i) => (i.note = e.target.value || undefined))} placeholder="Line under the item (optional)" />
        <input
          key={item.dietary.join(",")}
          className={inputCls}
          defaultValue={item.dietary.join(", ")}
          onBlur={(e) => {
            const codes = e.target.value.split(",").map((c) => c.trim()).filter(Boolean);
            setItem((i) => (i.dietary = codes));
          }}
          placeholder="Codes: V, GF, DF"
        />
      </div>
    </div>
  );
}
