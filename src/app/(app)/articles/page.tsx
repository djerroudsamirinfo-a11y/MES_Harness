import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    include: { _count: { select: { bomLines: true, workOrders: true } } },
    orderBy: { partNumber: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Articles / BOM</h1>
        <p className="text-sm text-slate-500">Références produits et nomenclatures</p>
      </div>
      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Désignation</th>
              <th>Rév.</th>
              <th>Lignes BOM</th>
              <th>OF</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td>
                  <Link
                    href={`/articles/${a.id}`}
                    className="font-semibold text-emerald-700 hover:underline"
                  >
                    {a.partNumber}
                  </Link>
                </td>
                <td>{a.designation}</td>
                <td>{a.revision}</td>
                <td>{a._count.bomLines}</td>
                <td>{a._count.workOrders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
