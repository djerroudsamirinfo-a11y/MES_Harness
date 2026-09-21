import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateShort } from "@/lib/labels";
import { getSession } from "@/lib/auth";
import { NewOfForm } from "./NewOfForm";

export const dynamic = "force-dynamic";

export default async function WorkOrdersPage() {
  const session = await getSession();
  const ofs = await prisma.workOrder.findMany({
    include: { article: true },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
  const articles = await prisma.article.findMany({
    where: { active: true },
    orderBy: { partNumber: "asc" },
  });
  const canCreate = session && session.role !== "OPERATEUR";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ordres de fabrication</h1>
          <p className="text-sm text-slate-500">{ofs.length} OF au total</p>
        </div>
      </div>

      {canCreate && (
        <Card title="Nouvel OF">
          <NewOfForm articles={articles.map((a) => ({ id: a.id, label: `${a.partNumber} — ${a.designation}` }))} />
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Article</th>
                <th>Qté</th>
                <th>Priorité</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th>Lots</th>
              </tr>
            </thead>
            <tbody>
              {ofs.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td>
                    <Link
                      href={`/work-orders/${o.id}`}
                      className="font-semibold text-emerald-700 hover:underline"
                    >
                      {o.number}
                    </Link>
                  </td>
                  <td>
                    <div className="font-medium">{o.article.partNumber}</div>
                    <div className="text-xs text-slate-500">{o.article.designation}</div>
                  </td>
                  <td>
                    {o.qtyGood}/{o.quantity}
                    {o.qtyScrap > 0 && (
                      <span className="ml-1 text-xs text-red-600">(-{o.qtyScrap})</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        o.priority <= 2
                          ? "bg-red-100 text-red-700"
                          : o.priority <= 4
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {o.priority}
                    </span>
                  </td>
                  <td
                    className={
                      o.dueDate && o.dueDate < new Date() && !["TERMINE", "ANNULE"].includes(o.status)
                        ? "font-medium text-red-600"
                        : ""
                    }
                  >
                    {formatDateShort(o.dueDate)}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="max-w-[140px] truncate text-xs text-slate-500">
                    {o.wireLot || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
