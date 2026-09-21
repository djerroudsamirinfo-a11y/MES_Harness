import { OF_STATUS_COLORS, OF_STATUS_LABELS, OfStatus } from "@/lib/of-state";

export function StatusBadge({ status }: { status: string }) {
  const s = status as OfStatus;
  const cls = OF_STATUS_COLORS[s] || "bg-slate-100 text-slate-700";
  const label = OF_STATUS_LABELS[s] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function OpStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "En attente", cls: "bg-slate-100 text-slate-600" },
    EN_COURS: { label: "En cours", cls: "bg-amber-100 text-amber-800" },
    TERMINE: { label: "Terminé", cls: "bg-emerald-100 text-emerald-800" },
    SKIPPED: { label: "Ignoré", cls: "bg-slate-50 text-slate-400" },
  };
  const m = map[status] || { label: status, cls: "bg-slate-100" };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
