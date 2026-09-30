export function PaletteSwatches({ palette }: { palette: { hex: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {palette.map((c) => (
        <div
          key={c.hex}
          className="flex h-20 flex-col justify-end rounded-lg p-2.5"
          style={{ backgroundColor: `#${c.hex}` }}
        >
          <span className="text-xs font-semibold text-white drop-shadow-sm">{c.label}</span>
          <span className="text-[10px] text-white/80">#{c.hex}</span>
        </div>
      ))}
    </div>
  );
}
