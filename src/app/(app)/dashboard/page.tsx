import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, StatCard } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateShort } from "@/lib/labels";
import { startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = startOfDay(new Date());

  const centers = await prisma.workCenter.findMany({
    where: { active: true },
    orderBy: { sequence: "asc" },
    include: {
      operations: {
        where: {
          status: { in: ["EN_COURS", "PENDING"] },
          workOrder: { status: { in: ["LANCE", "EN_COURS", "HOLD"] } },
        },
        include: { workOrder: { include: { article: true } } },
      },
    },
  });

  const openOfs = await prisma.workOrder.findMany({
    where: { status: { in: ["LANCE", "EN_COURS", "HOLD", "BROUILLON"] } },
    include: { article: true },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });

  const lateOfs = openOfs.filter(
    (o) => o.dueDate && o.dueDate < new Date() && o.status !== "BROUILLON"
  );

  const opsToday = await prisma.operation.findMany({
    where: { completedAt: { gte: today }, status: "TERMINE" },
  });
  const scrapToday = opsToday.reduce((s, o) => s + o.qtyScrap, 0);
  const throughputToday = opsToday.reduce((s, o) => s + o.qtyGood, 0);
  const holdCount = openOfs.filter((o) => o.status === "HOLD").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-500">
          Atelier Coupe-Sertissage → Formboard → Test → Emballage
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="OF ouverts" value={openOfs.length} hint="Brouillon à hold" />
        <StatCard
          label="OF en retard"
          value={lateOfs.length}
          tone={lateOfs.length ? "danger" : "ok"}
          hint="Échéance dépassée"
        />
        <StatCard
          label="Rebuts aujourd'hui"
          value={scrapToday}
          tone={scrapToday ? "warn" : "default"}
        />
        <StatCard
          label="Débit bon aujourd'hui"
          value={throughputToday}
          tone="ok"
          hint="Pièces bonnes terminées"
        />
      </div>

      {holdCount > 0 && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <strong>{holdCount} OF en hold qualité</strong> — vérifier les tests électriques avant
          reprise.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="WIP par poste">
          <div className="space-y-3">
            {centers.map((c) => {
              const enCours = c.operations.filter((o) => o.status === "EN_COURS");
              const pending = c.operations.filter((o) => o.status === "PENDING");
              return (
                <div key={c.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {enCours.length} en cours · {pending.length} en file
                    </div>
                  </div>
                  {enCours.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">Aucune opération active</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {enCours.map((o) => (
                        <li key={o.id} className="text-sm">
                          <Link
                            href={`/work-orders/${o.workOrderId}`}
                            className="font-medium text-emerald-700 hover:underline"
                          >
                            {o.workOrder.number}
                          </Link>
                          <span className="text-slate-500">
                            {" "}
                            — {o.workOrder.article.partNumber} (×{o.workOrder.quantity})
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
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
          {lateOfs.length === 0 ? (
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
                {lateOfs.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        href={`/work-orders/${o.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {o.number}
                      </Link>
                    </td>
                    <td className="text-slate-600">{o.article.partNumber}</td>
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
