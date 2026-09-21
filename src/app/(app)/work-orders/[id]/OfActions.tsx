"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { nextAllowed, OF_STATUS_LABELS, OfStatus } from "@/lib/of-state";

export function OfActions({
  ofId,
  status,
  role,
}: {
  ofId: string;
  status: string;
  role: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const allowed = nextAllowed(status as OfStatus).filter((t) => {
    if (role === "OPERATEUR" && (t === "ANNULE" || t === "HOLD")) return false;
    return true;
  });

  async function transition(to: OfStatus) {
    setLoading(true);
    setError("");
    const holdReason =
      to === "HOLD" ? window.prompt("Motif du hold :", "Hold qualité") || "Hold qualité" : undefined;
    const res = await fetch(`/api/work-orders/${ofId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transition", to, holdReason }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erreur");
      return;
    }
    router.refresh();
  }

  if (allowed.length === 0) {
    return <p className="text-sm text-slate-500">Aucune transition possible depuis cet état.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        Statut actuel : <strong>{OF_STATUS_LABELS[status as OfStatus] || status}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        {allowed.map((to) => (
          <button
            key={to}
            disabled={loading}
            onClick={() => transition(to)}
            className={
              to === "ANNULE"
                ? "btn-danger"
                : to === "HOLD"
                  ? "btn-warn"
                  : to === "TERMINE"
                    ? "btn-primary"
                    : "btn-secondary"
            }
          >
            → {OF_STATUS_LABELS[to]}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
