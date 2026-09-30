"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { DayCovers } from "@/lib/mock/reservations";

interface ChartRow extends DayCovers {
  lastYearCovers?: number;
}

function CoversTooltip({
  active,
  payload,
  label,
  accent,
  showCompare,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
  accent: string;
  showCompare?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const current = payload.find((p) => p.dataKey === "covers")?.value;
  const lastYear = payload.find((p) => p.dataKey === "lastYearCovers")?.value;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-sm font-semibold text-ink">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
        {current} covers
      </p>
      {showCompare && lastYear !== undefined && (
        <p className="text-xs text-ink-soft">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-ink-soft/40" />
          {lastYear} covers last year
        </p>
      )}
    </div>
  );
}

export function CoversChart({
  data,
  accent,
  selectedDate,
  onSelectDate,
  compareData,
}: {
  data: DayCovers[];
  accent: string;
  /** Highlights the bar for this date (yyyy-MM-dd) and hints the chart is clickable. */
  selectedDate?: string;
  /** When provided, bars become clickable and call back with that day's date. */
  onSelectDate?: (date: string) => void;
  /** Same-length array (matched by index -- both are always Mon-Sun) shown as a muted comparison bar alongside each day. */
  compareData?: DayCovers[];
}) {
  const chartData: ChartRow[] = data.map((d, i) => ({ ...d, lastYearCovers: compareData?.[i]?.covers }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e7e2d9" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b6459", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(201,168,76,0.08)" }}
          content={<CoversTooltip accent={accent} showCompare={Boolean(compareData)} />}
        />
        {compareData && (
          <Bar dataKey="lastYearCovers" fill="#c9c3b8" radius={[4, 4, 0, 0]} maxBarSize={16} />
        )}
        <Bar
          dataKey="covers"
          fill={accent}
          radius={[4, 4, 0, 0]}
          maxBarSize={compareData ? 16 : 24}
          onClick={
            onSelectDate ? (entry: { payload?: DayCovers }) => entry.payload && onSelectDate(entry.payload.date) : undefined
          }
          cursor={onSelectDate ? "pointer" : undefined}
        >
          {data.map((d) => (
            <Cell key={d.date} fillOpacity={!selectedDate || d.date === selectedDate ? 1 : 0.4} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
