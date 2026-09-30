"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, X, Link as LinkIcon } from "lucide-react";
import { VenueSlug } from "@/lib/types";
import { uploadPostImage } from "@/lib/social/image-upload";
import { cn } from "@/lib/utils";

export function ImageUploadField({
  venueSlug,
  imageUrl,
  onChange,
}: {
  venueSlug: VenueSlug;
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const result = await uploadPostImage(file, venueSlug);
    setUploading(false);
    if (!result.ok) {
      setError(result.error ?? "Upload failed.");
      return;
    }
    onChange(result.url ?? null);
  }

  if (imageUrl) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
        <button
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          aria-label="Remove image"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (pasteMode) {
    return (
      <div>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
          <LinkIcon className="h-4 w-4 shrink-0 text-ink-soft" />
          <input
            autoFocus
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="https://..."
            className="w-full text-sm text-ink outline-none"
          />
        </div>
        <button
          onClick={() => setPasteMode(false)}
          className="mt-1.5 text-[11px] font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          Upload a file instead
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-6 text-center transition hover:border-gold hover:bg-gold/5",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-ink-soft" />
        ) : (
          <ImageIcon className="h-5 w-5 text-ink-soft" />
        )}
        <span className="text-xs font-medium text-ink-soft">
          {uploading ? "Uploading..." : "Click to upload an image (max 4MB)"}
        </span>
      </button>
      {error && <p className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>}
      <button
        onClick={() => setPasteMode(true)}
        className="mt-1.5 text-[11px] font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
      >
        Or paste an image URL instead
      </button>
    </div>
  );
}
