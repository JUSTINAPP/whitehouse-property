"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { DailyMetric } from "@/lib/mock/instagram-analytics";

function ReachTooltip({
  active,
  payload,
  label,
  accent,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  accent: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-sm font-semibold text-ink">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
        {payload[0].value.toLocaleString()} reach
      </p>
    </div>
  );
}

export function ReachChart({ data, accent }: { data: DailyMetric[]; accent: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e7e2d9" strokeDasharray="0" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b6459", fontSize: 12 }} />
        <Tooltip cursor={{ fill: "rgba(201,168,76,0.08)" }} content={<ReachTooltip accent={accent} />} />
        <Bar dataKey="reach" fill={accent} radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
