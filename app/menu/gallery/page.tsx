"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImageUp, Loader2, Plus, Trash2 } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { isSupabaseConfigured } from "@/lib/supabase/status";
import { getShotListItems, ShotListItem } from "@/lib/menu-shot-list";
import { fetchGalleryPhotos, uploadGalleryPhoto, deleteGalleryPhoto, GalleryPhoto, FeaturedType } from "@/lib/menu-gallery-data";
import { cn } from "@/lib/utils";

const FEATURED_BUCKETS: { type: FeaturedType; label: string; hint: string }[] = [
  { type: "groups", label: "Group / table shots", hint: "A spread shared across the table, the kind of shot that sells a group booking." },
  { type: "drinks", label: "Drinks", hint: "Cocktails, wine pours, coffee — close-up and styled." },
  { type: "atmosphere", label: "Atmosphere", hint: "Room, light, the view, guests enjoying the space." },
  { type: "other", label: "Other hero shots", hint: "Anything else worth featuring that isn't a single dish." },
];

export default function MenuGalleryPage() {
  const { venue } = useVenue();
  const [items, setItems] = useState<ShotListItem[] | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off this fetch's loading state is intentional here
    setLoading(true);
    Promise.all([getShotListItems(venue.slug), fetchGalleryPhotos(venue.slug)]).then(([shotList, galleryPhotos]) => {
      if (cancelled) return;
      setItems(shotList);
      setPhotos(galleryPhotos);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug]);

  const photoByItemKey = useMemo(() => {
    const map = new Map<string, GalleryPhoto>();
    for (const p of photos) {
      if (p.category === "item" && p.itemKey) map.set(p.itemKey, p);
    }
    return map;
  }, [photos]);

  const featuredByType = useMemo(() => {
    const map = new Map<FeaturedType, GalleryPhoto[]>();
    for (const p of photos) {
      if (p.category === "featured" && p.featuredType) {
        map.set(p.featuredType, [...(map.get(p.featuredType) ?? []), p]);
      }
    }
    return map;
  }, [photos]);

  const groupedItems = useMemo(() => {
    if (!items) return [];
    const bySection = new Map<string, ShotListItem[]>();
    for (const item of items) {
      bySection.set(item.sectionTitle, [...(bySection.get(item.sectionTitle) ?? []), item]);
    }
    return Array.from(bySection.entries());
  }, [items]);

  const shotCount = items ? items.filter((i) => photoByItemKey.has(i.key)).length : 0;

  async function handleItemUpload(e: ChangeEvent<HTMLInputElement>, item: ShotListItem) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingKey(item.key);
    const res = await uploadGalleryPhoto(file, venue.slug, { category: "item", itemKey: item.key, itemName: item.name });
    setUploadingKey(null);
    if (res.ok && res.photo) setPhotos((prev) => [res.photo!, ...prev]);
  }

  async function handleFeaturedUpload(e: ChangeEvent<HTMLInputElement>, type: FeaturedType) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingKey(`featured-${type}`);
    const res = await uploadGalleryPhoto(file, venue.slug, { category: "featured", featuredType: type });
    setUploadingKey(null);
    if (res.ok && res.photo) setPhotos((prev) => [res.photo!, ...prev]);
  }

  async function handleDelete(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    await deleteGalleryPhoto(id);
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <PageHeader title="Shot List & Gallery" subtitle="Plan and track food photography against the real, current menu." />
        <IntegrationNote text="Supabase isn't configured in this environment yet — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to upload and track photos here." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Shot List & Gallery"
        subtitle={`Every square below is read live off ${venue.name}'s current menu — a dish gets a square the moment it's on the menu, and it fills in the moment it's shot. Nothing to mark done manually.`}
      />

      {/* Featured / hero shots */}
      <div className="mb-8 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
          >
            <Camera className="h-4 w-4" style={{ color: venue.accent }} />
          </span>
          <h3 className="text-sm font-semibold text-ink">Featured hero shots</h3>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_BUCKETS.map((bucket) => {
            const bucketPhotos = featuredByType.get(bucket.type) ?? [];
            const isUploading = uploadingKey === `featured-${bucket.type}`;
            return (
              <div key={bucket.type}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink">{bucket.label}</p>
                <p className="mb-2 text-[11px] text-ink-soft">{bucket.hint}</p>
                <div className="grid grid-cols-2 gap-2">
                  {bucketPhotos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.imageUrl} alt={bucket.label} className="h-full w-full object-cover" />
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="absolute right-1 top-1 hidden rounded-md bg-black/60 p-1 text-white group-hover:flex"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputs.current[`featured-${bucket.type}`]?.click()}
                    disabled={isUploading}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-ink-soft hover:border-ink-soft hover:text-ink disabled:opacity-60"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                  <input
                    ref={(el) => {
                      fileInputs.current[`featured-${bucket.type}`] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFeaturedUpload(e, bucket.type)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-item shot list */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reading the current menu...
        </div>
      ) : !items || items.length === 0 ? (
        <IntegrationNote text={`No menu on file for ${venue.name} yet, so there's nothing to build a shot list from.`} />
      ) : (
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Dish-by-dish shot list</h3>
            <p className="text-sm font-medium" style={{ color: venue.accent }}>
              {shotCount} of {items.length} shot
            </p>
          </div>

          {groupedItems.map(([sectionTitle, sectionItems]) => (
            <div key={sectionTitle} className="mb-6 last:mb-0">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">{sectionTitle}</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {sectionItems.map((item) => {
                  const photo = photoByItemKey.get(item.key);
                  const isUploading = uploadingKey === item.key;
                  return (
                    <div key={item.key} className="group relative">
                      <button
                        onClick={() => fileInputs.current[item.key]?.click()}
                        disabled={isUploading}
                        className={cn(
                          "flex aspect-square w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border text-center",
                          photo ? "border-border" : "border-dashed border-border text-ink-soft hover:border-ink-soft hover:text-ink"
                        )}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <>
                            <ImageUp className="h-4 w-4" />
                            <span className="px-1 text-[10px] font-medium leading-tight">{item.name}</span>
                          </>
                        )}
                      </button>
                      {photo && (
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="absolute right-1 top-1 hidden rounded-md bg-black/60 p-1 text-white group-hover:flex"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      {photo && <p className="mt-1 truncate text-[10px] text-ink-soft">{item.name}</p>}
                      <input
                        ref={(el) => {
                          fileInputs.current[item.key] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleItemUpload(e, item)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
