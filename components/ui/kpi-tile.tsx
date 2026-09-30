import { LucideIcon } from "lucide-react";

export function KpiTile({
  label,
  value,
  suffix,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: LucideIcon;
  accent: string;
  trend?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)` }}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color: accent }} />
        </span>
        {trend && (
          <span className="rounded-full bg-cream-dim px-2 py-0.5 text-xs font-medium text-ink-soft">
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-ink">
        {value}
        {suffix && <span className="ml-0.5 text-base font-medium text-ink-soft">{suffix}</span>}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
