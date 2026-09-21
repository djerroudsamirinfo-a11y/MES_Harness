"use client";

export type ToastTone = "ok" | "error" | "info";

export function ScanToast({
  message,
  tone,
}: {
  message: string | null;
  tone: ToastTone;
}) {
  if (!message) return null;
  const tones: Record<ToastTone, string> = {
    ok: "border-emerald-400 bg-emerald-50 text-emerald-900",
    error: "border-red-400 bg-red-50 text-red-900",
    info: "border-sky-400 bg-sky-50 text-sky-900",
  };
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm font-semibold shadow-lg scan-toast-flash ${tones[tone]}`}
    >
      {message}
    </div>
  );
}
