import { Circle, Clock, CheckCircle2, AlertCircle, LucideIcon } from "lucide-react";
import { SocialStatus } from "./types";

// Central status → visual mapping shared by the calendar grid, list view,
// feed preview and the post modal's status banner, so "what does scheduled
// look like" only has one answer in the codebase.
export const STATUS_META: Record<
  SocialStatus,
  { label: string; icon: LucideIcon; border: string; text: string; bg: string; dot: string }
> = {
  draft: { label: "Draft", icon: Circle, border: "#9ca3af", text: "#4b5563", bg: "#f3f4f6", dot: "#9ca3af" },
  scheduled: { label: "Scheduled", icon: Clock, border: "#3b82f6", text: "#1d4ed8", bg: "#eff6ff", dot: "#3b82f6" },
  published: { label: "Published", icon: CheckCircle2, border: "#22c55e", text: "#15803d", bg: "#f0fdf4", dot: "#22c55e" },
  failed: { label: "Failed", icon: AlertCircle, border: "#ef4444", text: "#b91c1c", bg: "#fef2f2", dot: "#ef4444" },
};
