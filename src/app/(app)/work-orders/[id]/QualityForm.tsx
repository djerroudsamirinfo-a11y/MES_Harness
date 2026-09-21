"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function QualityForm({
  ofId,
  reasonCodes,
}: {
  ofId: string;
  reasonCodes: { code: string; label: string }[];
  canHold?: boolean;
}) {
  const router = useRouter();
  const [result, setResult] = useState<"PASS" | "FAIL">("PASS");
  const [reasonCode, setReasonCode] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [qtyTested, setQtyTested] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: ofId,
        result,
        reasonCode: result === "FAIL" ? reasonCode : null,
        reasonText: result === "FAIL" ? reasonText : null,
        qtyTested,
        autoHold: result === "FAIL",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={result === "PASS"}
            onChange={() => setResult("PASS")}
          />
          Conforme (PASS)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={result === "FAIL"}
            onChange={() => setResult("FAIL")}
          />
          Non conforme (FAIL)
        </label>
      </div>
      <div>
        <label>Quantité testée</label>
        <input
          type="number"
          min={1}
          className="w-full"
          value={qtyTested}
          onChange={(e) => setQtyTested(Number(e.target.value))}
        />
      </div>
      {result === "FAIL" && (
        <>
          <div>
            <label>Code motif</label>
            <select
              className="w-full"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              required
            >
              <option value="">— Choisir —</option>
              {reasonCodes.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code} — {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Détail</label>
            <input
              className="w-full"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Ex. court-circuit voies 3-5"
            />
          </div>
          <p className="text-xs text-orange-700">
            Un FAIL place automatiquement l&apos;OF en hold.
          </p>
        </>
      )}
      <button type="submit" className="btn-primary" disabled={loading}>
        Enregistrer le test
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
