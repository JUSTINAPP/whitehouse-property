import { VenueSlug } from "./types";

export interface DriveFile {
  id: string;
  name: string;
  addedAt: string; // ISO date
}

/**
 * No shared Drive folder exists for Whitehouse Property Group yet -- this
 * is a prospective client, not a connected one. Left null for all venues
 * (same honest "not yet populated" pattern the real dashboard uses for a
 * venue with no photo drop yet) rather than pointing at another client's
 * real private folder.
 */
export const DRIVE_FOLDERS: Record<VenueSlug, { folderId: string; folderUrl: string; files: DriveFile[] } | null> = {
  "beach-road": null,
  barrys: null,
  tilbury: null,
  vicar: null,
};

export function driveThumbnailUrl(fileId: string, width = 500): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
