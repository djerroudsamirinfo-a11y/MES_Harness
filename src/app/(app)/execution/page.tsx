import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { StatusBadge, OpStatusBadge } from "@/components/StatusBadge";
import { ExecutionPanel } from "./ExecutionPanel";

export const dynamic = "force-dynamic";

export default async function ExecutionPage() {
  const centers = await prisma.workCenter.findMany({
    where: { active: true },
    orderBy: { sequence: "asc" },
  });

  const operations = await prisma.operation.findMany({
    where: {
      status: { in: ["PENDING", "EN_COURS"] },
      workOrder: { status: { in: ["LANCE", "EN_COURS"] } },
    },
    include: {
      workCenter: true,
      workOrder: { include: { article: true } },
      operator: true,
    },
    orderBy: [{ workCenter: { sequence: "asc" } }, { workOrder: { priority: "asc" } }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exécution atelier</h1>
        <p className="text-sm text-slate-500">
          Démarrer / terminer les opérations · saisir bon / rebut / retouche
        </p>
      </div>

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
          {operations.map((op) => (
            <Card key={op.id}>
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
          ))}
        </div>
      )}
    </div>
  );
}
