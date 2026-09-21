"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function TraceForm(props: {
  ofId: string;
  wireLot: string;
  connectorLot: string;
  finishedLot: string;
  serialStart: string;
}) {
  const router = useRouter();
  const [wireLot, setWireLot] = useState(props.wireLot);
  const [connectorLot, setConnectorLot] = useState(props.connectorLot);
  const [finishedLot, setFinishedLot] = useState(props.finishedLot);
  const [serialStart, setSerialStart] = useState(props.serialStart);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/work-orders/${props.ofId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateTrace",
        wireLot,
        connectorLot,
        finishedLot,
        serialStart,
      }),
    });
    if (res.ok) {
      setMsg("Enregistré");
      router.refresh();
    } else {
      setMsg("Erreur");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div>
        <label>Lot fil</label>
        <input className="w-full" value={wireLot} onChange={(e) => setWireLot(e.target.value)} />
      </div>
      <div>
        <label>Lot connecteurs</label>
        <input
          className="w-full"
          value={connectorLot}
          onChange={(e) => setConnectorLot(e.target.value)}
        />
      </div>
      <div>
        <label>Lot fini / série</label>
        <input
          className="w-full"
          value={finishedLot}
          onChange={(e) => setFinishedLot(e.target.value)}
        />
      </div>
      <div>
        <label>N° série début</label>
        <input
          className="w-full"
          value={serialStart}
          onChange={(e) => setSerialStart(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-secondary w-full">
        Enregistrer traçabilité
      </button>
      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
    </form>
  );
}
