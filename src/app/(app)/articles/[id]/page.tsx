import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      bomLines: { orderBy: { lineNumber: "asc" } },
      workOrders: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!article) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/articles" className="text-xs text-emerald-700 hover:underline">
          ← Articles
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{article.partNumber}</h1>
        <p className="text-sm text-slate-500">
          Rév. {article.revision} — {article.designation}
        </p>
        {article.description && (
          <p className="mt-2 text-sm text-slate-600">{article.description}</p>
        )}
      </div>

      <Card title="Nomenclature">
        <table className="table">
          <thead>
            <tr>
              <th>Ligne</th>
              <th>Composant</th>
              <th>Désignation</th>
              <th>Qté</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {article.bomLines.map((l) => (
              <tr key={l.id}>
                <td>{l.lineNumber}</td>
                <td className="font-mono text-xs">{l.componentPn}</td>
                <td>{l.designation}</td>
                <td>
                  {l.quantity} {l.unit}
                </td>
                <td className="text-xs text-slate-500">{l.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="OF liés">
        {article.workOrders.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun OF</p>
        ) : (
          <ul className="space-y-2">
            {article.workOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between text-sm">
                <Link href={`/work-orders/${o.id}`} className="font-medium text-emerald-700">
                  {o.number}
                </Link>
                <span className="text-slate-500">×{o.quantity}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
