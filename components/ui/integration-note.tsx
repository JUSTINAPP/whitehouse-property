import { Zap } from "lucide-react";

export function IntegrationNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}
