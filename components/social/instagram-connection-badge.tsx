"use client";

import { AtSign } from "lucide-react";
import { InstagramConnection } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InstagramConnectionBadge({
  connection,
  loading,
  onConnect,
}: {
  connection: InstagramConnection | null;
  loading: boolean;
  onConnect: () => void;
}) {
  const connected = connection?.connected ?? false;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", connected ? "bg-emerald-500" : "bg-slate-300")} />
      <AtSign className="h-4 w-4 text-ink-soft" />
      <span className="text-xs font-medium text-ink-soft">
        {loading ? "Checking..." : connected ? `@${connection?.username ?? "connected"}` : "Not connected"}
      </span>
      {!loading && !connected && (
        <button
          onClick={onConnect}
          className="ml-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-gold hover:text-ink"
        >
          Connect Instagram
        </button>
      )}
    </div>
  );
}
