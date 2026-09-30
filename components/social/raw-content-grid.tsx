import { ImageOff } from "lucide-react";
import { DriveFile, driveThumbnailUrl, driveViewUrl } from "@/lib/drive-content";

export function RawContentGrid({ files }: { files: DriveFile[] }) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16 text-center">
        <ImageOff className="mb-3 h-8 w-8 text-ink-soft/40" />
        <p className="text-sm font-medium text-ink">No raw content yet</p>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">
          This venue&rsquo;s Drive folder is empty right now — nothing has been dropped in since the last shoot.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {files.map((file) => (
        <a
          key={file.id}
          href={driveViewUrl(file.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-cream-dim"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={driveThumbnailUrl(file.id, 400)}
            alt={file.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            {file.name}
          </div>
        </a>
      ))}
    </div>
  );
}
