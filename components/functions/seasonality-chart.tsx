"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MonthlySeasonality } from "@/lib/mock/function-analytics";

function SeasonalityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-ink-soft">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs text-ink">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.dataKey === "confirmedRevenue" ? "Confirmed" : "Pipeline"}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function SeasonalityChart({ data, accent }: { data: MonthlySeasonality[]; accent: string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e7e2d9" strokeDasharray="0" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#6b6459", fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b6459", fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
        <Tooltip content={<SeasonalityTooltip />} cursor={{ fill: "rgba(201,168,76,0.06)" }} />
        <Legend
          formatter={(value) => (value === "confirmedRevenue" ? "Confirmed revenue" : "Pipeline value")}
          wrapperStyle={{ fontSize: 12, color: "#6b6459" }}
        />
        <Bar dataKey="confirmedRevenue" stackId="a" fill={accent} radius={[0, 0, 0, 0]} maxBarSize={28} name="confirmedRevenue" />
        <Bar dataKey="pipelineRevenue" stackId="a" fill={accent} fillOpacity={0.3} radius={[4, 4, 0, 0]} maxBarSize={28} name="pipelineRevenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}
