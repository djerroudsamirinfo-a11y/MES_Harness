"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExecutionPanel({
  operationId,
  status,
  plannedQty,
  currentGood,
  currentScrap,
  currentRework,
}: {
  operationId: string;
  status: string;
  plannedQty: number;
  currentGood: number;
  currentScrap: number;
  currentRework: number;
}) {
  const router = useRouter();
  const [qtyGood, setQtyGood] = useState(currentGood || plannedQty);
  const [qtyScrap, setQtyScrap] = useState(currentScrap || 0);
  const [qtyRework, setQtyRework] = useState(currentRework || 0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/operations/${operationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erreur");
      return;
    }
    router.refresh();
  }

  async function complete() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/operations/${operationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", qtyGood, qtyScrap, qtyRework, notes }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erreur");
      return;
    }
    router.refresh();
  }

  if (status === "PENDING") {
    return (
      <div>
        <button onClick={start} disabled={loading} className="btn-primary w-full">
          {loading ? "…" : "Démarrer l'opération"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label>Bon</label>
          <input
            type="number"
            min={0}
            className="w-full"
            value={qtyGood}
            onChange={(e) => setQtyGood(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Rebut</label>
          <input
            type="number"
            min={0}
            className="w-full"
            value={qtyScrap}
            onChange={(e) => setQtyScrap(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Retouche</label>
          <input
            type="number"
            min={0}
            className="w-full"
            value={qtyRework}
            onChange={(e) => setQtyRework(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label>Notes</label>
        <input
          className="w-full"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optionnel"
        />
      </div>
      <button onClick={complete} disabled={loading} className="btn-primary w-full">
        {loading ? "…" : "Terminer l'opération"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
