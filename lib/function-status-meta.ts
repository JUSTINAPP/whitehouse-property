import { FunctionStatus } from "./types";

type BadgeVariant = "confirmed" | "pending" | "cancelled" | "draft" | "scheduled" | "published" | "neutral" | "gold";

export const FUNCTION_STATUS_COLORS: Record<FunctionStatus, { bg: string; border: string; text: string; dot: string }> = {
  confirmed: { bg: "#e7f5ee", border: "#a8ddc8", text: "#0f6848", dot: "#14b876" },
  tentative: { bg: "#fef3e0", border: "#f6d896", text: "#92620a", dot: "#f5a623" },
  enquiry: { bg: "#e3f0fb", border: "#a7cdf0", text: "#1e4f8a", dot: "#4c8fd6" },
  cancelled: { bg: "#fbe9e9", border: "#f0b8b8", text: "#8a2323", dot: "#d64545" },
};

export const FUNCTION_STATUS_LABELS: Record<FunctionStatus, string> = {
  confirmed: "Confirmed",
  tentative: "Tentative",
  enquiry: "Enquiry",
  cancelled: "Cancelled",
};

export const FUNCTION_STATUS_BADGE: Record<FunctionStatus, BadgeVariant> = {
  confirmed: "confirmed",
  tentative: "pending",
  enquiry: "neutral",
  cancelled: "cancelled",
};
