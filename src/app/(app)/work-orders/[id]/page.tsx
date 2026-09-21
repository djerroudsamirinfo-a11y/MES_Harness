import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { StatusBadge, OpStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/labels";
import { getSession } from "@/lib/auth";
import { OfActions } from "./OfActions";
import { TraceForm } from "./TraceForm";
import { QualityForm } from "./QualityForm";

export const dynamic = "force-dynamic";

export default async function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const of = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      article: { include: { bomLines: { orderBy: { lineNumber: "asc" } } } },
      operations: {
        include: { workCenter: true, operator: true },
        orderBy: { sequence: "asc" },
      },
      qualityTests: { include: { testedBy: true }, orderBy: { testedAt: "desc" } },
    },
  });
  if (!of) notFound();

  const reasonCodes = await prisma.reasonCode.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/work-orders" className="text-xs text-emerald-700 hover:underline">
            ← Retour aux OF
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{of.number}</h1>
          <p className="text-sm text-slate-500">
            {of.article.partNumber} Rév. {of.article.revision} — {of.article.designation}
          </p>
        </div>
        <StatusBadge status={of.status} />
      </div>

      {of.status === "HOLD" && of.holdReason && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <strong>Hold :</strong> {of.holdReason}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Synthèse">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Quantité planifiée</dt>
              <dd className="font-semibold">{of.quantity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Bon / Rebut / Retouche</dt>
              <dd className="font-semibold">
                {of.qtyGood} / {of.qtyScrap} / {of.qtyRework}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Priorité</dt>
              <dd>{of.priority}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Échéance</dt>
              <dd>{formatDate(of.dueDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Lancé</dt>
              <dd>{formatDate(of.launchedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Terminé</dt>
              <dd>{formatDate(of.completedAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Actions statut">
          <OfActions
            ofId={of.id}
            status={of.status}
            role={session?.role || "OPERATEUR"}
          />
        </Card>

        <Card title="Traçabilité lots">
          <TraceForm
            ofId={of.id}
            wireLot={of.wireLot || ""}
            connectorLot={of.connectorLot || ""}
            finishedLot={of.finishedLot || ""}
            serialStart={of.serialStart || ""}
          />
        </Card>
      </div>

      <Card title="Opérations atelier">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Poste</th>
              <th>Statut</th>
              <th>Opérateur</th>
              <th>Bon / Rebut</th>
              <th>Horodatage</th>
            </tr>
          </thead>
          <tbody>
            {of.operations.map((op) => (
              <tr key={op.id}>
                <td>{op.sequence}</td>
                <td className="font-medium">{op.workCenter.name}</td>
                <td>
                  <OpStatusBadge status={op.status} />
                </td>
                <td className="text-sm">{op.operator?.name || "—"}</td>
                <td>
                  {op.qtyGood} / {op.qtyScrap}
                  {op.qtyRework > 0 && (
                    <span className="text-xs text-amber-700"> (+{op.qtyRework} ret.)</span>
                  )}
                </td>
                <td className="text-xs text-slate-500">
                  {op.startedAt ? `Début ${formatDate(op.startedAt)}` : "—"}
                  {op.completedAt && (
                    <>
                      <br />
                      Fin {formatDate(op.completedAt)}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3">
          <Link href="/execution" className="btn-primary">
            Aller à l&apos;exécution atelier
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Nomenclature (BOM)">
          <table className="table">
            <thead>
              <tr>
                <th>Ligne</th>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Qté</th>
              </tr>
            </thead>
            <tbody>
              {of.article.bomLines.map((l) => (
                <tr key={l.id}>
                  <td>{l.lineNumber}</td>
                  <td className="font-mono text-xs">{l.componentPn}</td>
                  <td>{l.designation}</td>
                  <td>
                    {l.quantity} {l.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Qualité — tests électriques">
          <QualityForm
            ofId={of.id}
            reasonCodes={reasonCodes.map((r) => ({ code: r.code, label: r.label }))}
            canHold={session?.role !== "OPERATEUR"}
          />
          {of.qualityTests.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Historique</h3>
              <ul className="space-y-2">
                {of.qualityTests.map((t) => (
                  <li
                    key={t.id}
                    className={`rounded-md px-3 py-2 text-sm ${
                      t.result === "PASS"
                        ? "bg-emerald-50 text-emerald-900"
                        : t.result === "FAIL"
                          ? "bg-red-50 text-red-900"
                          : "bg-slate-50"
                    }`}
                  >
                    <strong>{t.result}</strong> — {t.reasonCode || "OK"}{" "}
                    {t.reasonText && `(${t.reasonText})`} · ×{t.qtyTested} ·{" "}
                    {t.testedBy?.name || "?"} · {formatDate(t.testedAt)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
