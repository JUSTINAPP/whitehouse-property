import { LayoutGrid, GalleryHorizontal, Film, BookOpen, LucideIcon } from "lucide-react";
import { PostFormat } from "./types";

export const FORMAT_META: Record<PostFormat, { label: string; icon: LucideIcon; color: string }> = {
  grid: { label: "Photo", icon: LayoutGrid, color: "#64748b" }, // slate — standard feed post
  carousel: { label: "Carousel", icon: GalleryHorizontal, color: "#0891b2" }, // cyan
  reel: { label: "Reel", icon: Film, color: "#7c3aed" }, // violet
  story: { label: "Story", icon: BookOpen, color: "#f59e0b" }, // amber — stands out; these run daily
};
