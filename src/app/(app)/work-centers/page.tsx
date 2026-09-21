import { prisma } from "@/lib/prisma";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function WorkCentersPage() {
  const centers = await prisma.workCenter.findMany({
    orderBy: { sequence: "asc" },
    include: {
      _count: { select: { operations: true } },
      operations: {
        where: { status: "EN_COURS" },
        include: { workOrder: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Postes atelier</h1>
        <p className="text-sm text-slate-500">
          Flux Phase 1 : Coupe-Sertissage → Assemblage formboard → Test électrique → Emballage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {centers.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-slate-400">{c.code}</div>
                <h2 className="text-lg font-bold text-slate-900">
                  {c.sequence}. {c.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{c.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.active ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div>
                <span className="text-slate-500">Opérations totales :</span>{" "}
                <strong>{c._count.operations}</strong>
              </div>
              <div>
                <span className="text-slate-500">En cours :</span>{" "}
                <strong>{c.operations.length}</strong>
              </div>
            </div>
            {c.operations.length > 0 && (
              <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-sm">
                {c.operations.map((o) => (
                  <li key={o.id} className="text-emerald-700">
                    {o.workOrder.number}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
