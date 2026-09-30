"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DailyMetric } from "@/lib/mock/instagram-analytics";

function FollowersTooltip({
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
        {payload[0].value.toLocaleString()} followers
      </p>
    </div>
  );
}

export function FollowersChart({ data, accent }: { data: DailyMetric[]; accent: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e7e2d9" strokeDasharray="0" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b6459", fontSize: 12 }} />
        <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
        <Tooltip content={<FollowersTooltip accent={accent} />} />
        <Line type="monotone" dataKey="followers" stroke={accent} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
