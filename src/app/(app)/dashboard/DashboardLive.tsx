"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, StatCard } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateShort } from "@/lib/labels";

export type DashboardData = {
  updatedAt: string;
  openCount: number;
  holdCount: number;
  scrapToday: number;
  throughputToday: number;
  lateOfs: {
    id: string;
    number: string;
    status: string;
    dueDate: string | null;
    article: string;
  }[];
  wipByPoste: {
    id: string;
    code: string;
    name: string;
    enCours: number;
    enAttente: number;
    operations: {
      id: string;
      workOrderId: string;
      of: string;
      article: string;
      qty: number;
    }[];
  }[];
};

const POLL_MS = 6000;

export function DashboardLive({ initial }: { initial: DashboardData }) {
  const [data, setData] = useState(initial);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) {
        setError("Erreur rafraîchissement");
        return;
      }
      const json = (await res.json()) as DashboardData;
      setData(json);
      setError(null);
    } catch {
      setError("Réseau indisponible");
    }
  }, []);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [paused, refresh]);

  const timeLabel = new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500">
            Atelier Coupe-Sertissage → Formboard → Test → Emballage
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            Mis à jour à <strong className="text-slate-700">{timeLabel}</strong>
          </span>
          {error && <span className="text-red-600">{error}</span>}
          <button
            type="button"
            className="btn-secondary !px-2 !py-1 text-xs"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? "Reprendre" : "Pause"}
          </button>
          <button
            type="button"
            className="btn-secondary !px-2 !py-1 text-xs"
            onClick={() => void refresh()}
          >
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="OF ouverts" value={data.openCount} hint="Brouillon à hold" />
        <StatCard
          label="OF en retard"
          value={data.lateOfs.length}
          tone={data.lateOfs.length ? "danger" : "ok"}
          hint="Échéance dépassée"
        />
        <StatCard
          label="Rebuts aujourd'hui"
          value={data.scrapToday}
          tone={data.scrapToday ? "warn" : "default"}
        />
        <StatCard
          label="Débit bon aujourd'hui"
          value={data.throughputToday}
          tone="ok"
          hint="Pièces bonnes terminées"
        />
      </div>

      {data.holdCount > 0 && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <strong>{data.holdCount} OF en hold qualité</strong> — vérifier les tests
          électriques avant reprise.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="WIP par poste">
          <div className="space-y-3">
            {data.wipByPoste.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {c.enCours} en cours · {c.enAttente} en file
                  </div>
                </div>
                {c.operations.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-400">Aucune opération active</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {c.operations.map((o) => (
                      <li key={o.id} className="text-sm">
                        <Link
                          href={`/work-orders/${o.workOrderId}`}
                          className="font-medium text-emerald-700 hover:underline"
                        >
                          {o.of}
                        </Link>
                        <span className="text-slate-500">
                          {" "}
                          — {o.article} (×{o.qty})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="OF en retard"
          action={
            <Link href="/work-orders" className="text-xs font-medium text-emerald-700">
              Voir tous →
            </Link>
          }
        >
          {data.lateOfs.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun OF en retard. Bon travail !</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>OF</th>
                  <th>Article</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.lateOfs.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        href={`/work-orders/${o.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {o.number}
                      </Link>
                    </td>
                    <td className="text-slate-600">{o.article}</td>
                    <td className="text-red-600">{formatDateShort(o.dueDate)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
