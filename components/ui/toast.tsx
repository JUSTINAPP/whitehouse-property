"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface ToastState {
  id: number;
  message: string;
  tone: "success" | "error";
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = Date.now();
    setToast({ id, message, tone });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  return { toast, showToast };
}

export function ToastViewport({ toast }: { toast: { message: string; tone: "success" | "error" } | null }) {
  if (!toast) return null;
  const Icon = toast.tone === "success" ? CheckCircle2 : XCircle;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-ink shadow-lg">
      <Icon className={toast.tone === "success" ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-rose-600"} />
      {toast.message}
    </div>
  );
}
