"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { StatusBadge, OpStatusBadge } from "@/components/StatusBadge";
import { ScanToast, ToastTone } from "@/components/ScanToast";
import { assignLotFields, classifyScan } from "@/lib/scan";
import { ExecutionPanel } from "./ExecutionPanel";

export type FloorOp = {
  id: string;
  status: string;
  qtyGood: number;
  qtyScrap: number;
  qtyRework: number;
  workCenterId: string;
  workCenter: { id: string; code: string; name: string; sequence: number };
  workOrder: {
    id: string;
    number: string;
    status: string;
    quantity: number;
    wireLot: string | null;
    connectorLot: string | null;
    article: { partNumber: string; designation: string };
  };
};

export type FloorCenter = {
  id: string;
  code: string;
  name: string;
  sequence: number;
};

export function ExecutionFloor({
  initialOperations,
  centers,
}: {
  initialOperations: FloorOp[];
  centers: FloorCenter[];
}) {
  const router = useRouter();
  const [operations, setOperations] = useState(initialOperations);
  const [selectedOfId, setSelectedOfId] = useState<string | null>(null);
  const [scan, setScan] = useState("");
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [flash, setFlash] = useState<"ok" | "error" | null>(null);
  const [lotFocus, setLotFocus] = useState<"wire" | "connector" | null>(null);
  const [wireLot, setWireLot] = useState("");
  const [connectorLot, setConnectorLot] = useState("");
  const [savingLot, setSavingLot] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setOperations(initialOperations);
  }, [initialOperations]);

  const selectedOp = useMemo(
    () => operations.find((o) => o.workOrder.id === selectedOfId) || null,
    [operations, selectedOfId]
  );

  const isCoupeSert =
    selectedOp?.workCenter.code === "COUPE_SERT" ||
    selectedOp?.workCenter.sequence === 1;

  useEffect(() => {
    if (!selectedOfId) return;
    const op = operations.find((o) => o.workOrder.id === selectedOfId);
    if (!op) return;
    setWireLot(op.workOrder.wireLot || "");
    setConnectorLot(op.workOrder.connectorLot || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync lots only when OF selection changes
  }, [selectedOfId]);

  const showToast = useCallback((message: string, tone: ToastTone) => {
    setToast({ message, tone });
    setFlash(tone === "error" ? "error" : "ok");
    window.setTimeout(() => setToast(null), 2200);
    window.setTimeout(() => setFlash(null), 600);
  }, []);

  const selectOf = useCallback(
    (ofId: string, ofNumber: string) => {
      setSelectedOfId(ofId);
      showToast(`OF trouvé · ${ofNumber}`, "ok");
      requestAnimationFrame(() => {
        const el = cardRefs.current[ofId];
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
    [showToast]
  );

  async function persistLots(ofId: string, nextWire: string, nextConn: string) {
    setSavingLot(true);
    const res = await fetch(`/api/work-orders/${ofId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateTrace",
        wireLot: nextWire || null,
        connectorLot: nextConn || null,
      }),
    });
    setSavingLot(false);
    if (!res.ok) {
      showToast("Erreur enregistrement lot", "error");
      return false;
    }
    setOperations((prev) =>
      prev.map((o) =>
        o.workOrder.id === ofId
          ? {
              ...o,
              workOrder: {
                ...o.workOrder,
                wireLot: nextWire || null,
                connectorLot: nextConn || null,
              },
            }
          : o
      )
    );
    router.refresh();
    return true;
  }

  async function handleScanSubmit(e: FormEvent) {
    e.preventDefault();
    const code = scan.trim();
    if (!code) return;
    setScan("");

    const classified = classifyScan(code);

    if (classified.kind === "of") {
      const local = operations.find(
        (o) => o.workOrder.number.toUpperCase() === classified.value
      );
      if (local) {
        selectOf(local.workOrder.id, local.workOrder.number);
        scanRef.current?.focus();
        return;
      }
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        showToast(data.error || "OF inconnu", "error");
        scanRef.current?.focus();
        return;
      }
      showToast(`OF trouvé · ${data.workOrder.number} (hors file)`, "info");
      window.location.href = `/work-orders/${data.workOrder.id}`;
      return;
    }

    if (!selectedOp) {
      showToast("Sélectionnez d'abord un OF (scan OF-…)", "error");
      scanRef.current?.focus();
      return;
    }

    if (!isCoupeSert && (classified.kind === "wire" || classified.kind === "connector")) {
      showToast("Lots fil/connecteur : étape Coupe-Sertissage", "info");
    }

    const assigned = assignLotFields(code, { wireLot, connectorLot }, lotFocus);
    if (!assigned) {
      showToast("Code non reconnu", "error");
      scanRef.current?.focus();
      return;
    }

    setWireLot(assigned.wireLot);
    setConnectorLot(assigned.connectorLot);
    const ok = await persistLots(
      selectedOp.workOrder.id,
      assigned.wireLot,
      assigned.connectorLot
    );
    if (ok) {
      const label = assigned.field === "wire" ? "fil" : "connecteurs";
      showToast(`Lot saisi (${label})`, "ok");
    }
    setLotFocus(null);
    scanRef.current?.focus();
  }

  const [paused, setPaused] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>(() => new Date());

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) return;
        setUpdatedAt(new Date());
        router.refresh();
      } catch {
        /* ignore */
      }
    }, 7000);
    return () => window.clearInterval(id);
  }, [paused, router]);

  const timeLabel = updatedAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={`space-y-6 transition-colors duration-300 ${
        flash === "ok" ? "scan-flash-ok" : flash === "error" ? "scan-flash-err" : ""
      }`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Exécution atelier</h1>
          <p className="text-sm text-slate-500">
            Démarrer / terminer · scan OF ou lots · bon / rebut / retouche
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Mis à jour à {timeLabel}</span>
          <button
            type="button"
            className="btn-secondary !px-2 !py-1 text-xs"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Reprendre" : "Pause"}
          </button>
        </div>
      </div>

      <form
        onSubmit={handleScanSubmit}
        className={`rounded-xl border-2 bg-white p-4 shadow-sm ${
          flash === "ok"
            ? "border-emerald-500"
            : flash === "error"
              ? "border-red-500"
              : "border-emerald-600"
        }`}
      >
        <label className="mb-2 block text-sm font-semibold text-emerald-900">
          Scan code-barres (douchette ou clavier) — Entrée pour valider
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            ref={scanRef}
            autoFocus
            className="min-w-[16rem] flex-1 text-lg font-mono"
            placeholder="OF-2026-0001 · FIL-… · CONN-…"
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="btn-primary">
            Valider scan
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Saisie manuelle possible. Préfixes : OF-, FIL- / LOT-FIL-, CONN- / LOT-CONN-.
        </p>
      </form>

      {selectedOp && (
        <Card title={`OF sélectionné · ${selectedOp.workOrder.number}`}>
          <div className="mb-3 text-sm text-slate-600">
            {selectedOp.workCenter.name} · {selectedOp.workOrder.article.partNumber}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label>
                Lot fil {isCoupeSert && <span className="text-emerald-700">(scan)</span>}
              </label>
              <input
                className="w-full font-mono"
                value={wireLot}
                onFocus={() => setLotFocus("wire")}
                onChange={(e) => setWireLot(e.target.value)}
                onBlur={() => {
                  if (selectedOp) {
                    void persistLots(selectedOp.workOrder.id, wireLot, connectorLot);
                  }
                }}
              />
            </div>
            <div>
              <label>
                Lot connecteurs{" "}
                {isCoupeSert && <span className="text-emerald-700">(scan)</span>}
              </label>
              <input
                className="w-full font-mono"
                value={connectorLot}
                onFocus={() => setLotFocus("connector")}
                onChange={(e) => setConnectorLot(e.target.value)}
                onBlur={() => {
                  if (selectedOp) {
                    void persistLots(selectedOp.workOrder.id, wireLot, connectorLot);
                  }
                }}
              />
            </div>
          </div>
          {savingLot && <p className="mt-2 text-xs text-slate-400">Enregistrement…</p>}
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {centers.map((c) => {
          const n = operations.filter((o) => o.workCenterId === c.id).length;
          return (
            <span
              key={c.id}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              {c.name} · {n}
            </span>
          );
        })}
      </div>

      {operations.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Aucune opération en file. Lancez un OF ou libérez un hold.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {operations.map((op) => {
            const selected = selectedOfId === op.workOrder.id;
            return (
              <div
                key={op.id}
                ref={(el) => {
                  cardRefs.current[op.workOrder.id] = el;
                }}
                onClick={() => setSelectedOfId(op.workOrder.id)}
                className={`cursor-pointer rounded-xl transition ring-offset-2 ${
                  selected ? "ring-2 ring-emerald-600" : ""
                }`}
              >
                <Card>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        {op.workCenter.name}
                      </div>
                      <div className="text-lg font-bold">{op.workOrder.number}</div>
                      <div className="text-sm text-slate-600">
                        {op.workOrder.article.partNumber} — {op.workOrder.article.designation}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>Qté OF : {op.workOrder.quantity}</span>
                        {op.workOrder.wireLot && <span>Fil : {op.workOrder.wireLot}</span>}
                        {op.workOrder.connectorLot && (
                          <span>Conn. : {op.workOrder.connectorLot}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={op.workOrder.status} />
                      <OpStatusBadge status={op.status} />
                    </div>
                  </div>
                  <ExecutionPanel
                    operationId={op.id}
                    status={op.status}
                    plannedQty={op.workOrder.quantity}
                    currentGood={op.qtyGood}
                    currentScrap={op.qtyScrap}
                    currentRework={op.qtyRework}
                  />
                </Card>
              </div>
            );
          })}
        </div>
      )}

      <ScanToast message={toast?.message ?? null} tone={toast?.tone ?? "info"} />
    </div>
  );
}
