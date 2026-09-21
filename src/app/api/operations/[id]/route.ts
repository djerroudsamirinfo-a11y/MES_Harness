import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const op = await prisma.operation.findUnique({
    where: { id: params.id },
    include: { workOrder: true, workCenter: true },
  });
  if (!op) return NextResponse.json({ error: "Opération introuvable" }, { status: 404 });

  if (op.workOrder.status === "HOLD" || op.workOrder.status === "ANNULE" || op.workOrder.status === "TERMINE") {
    return NextResponse.json(
      { error: `OF ${op.workOrder.status} — exécution bloquée` },
      { status: 400 }
    );
  }

  const body = await req.json();
  const action = body.action as string;

  if (action === "start") {
    if (op.status === "TERMINE") {
      return NextResponse.json({ error: "Opération déjà terminée" }, { status: 400 });
    }
    const ofUpdates: Record<string, unknown> = {};
    if (op.workOrder.status === "BROUILLON" || op.workOrder.status === "LANCE") {
      ofUpdates.status = "EN_COURS";
      ofUpdates.startedAt = op.workOrder.startedAt || new Date();
      if (op.workOrder.status === "BROUILLON") ofUpdates.launchedAt = new Date();
    }

    const updated = await prisma.operation.update({
      where: { id: op.id },
      data: {
        status: "EN_COURS",
        operatorId: session.id,
        startedAt: op.startedAt || new Date(),
      },
      include: { workCenter: true, operator: true },
    });

    if (Object.keys(ofUpdates).length) {
      await prisma.workOrder.update({ where: { id: op.workOrderId }, data: ofUpdates });
    }
    return NextResponse.json(updated);
  }

  if (action === "complete") {
    const qtyGood = Number(body.qtyGood ?? 0);
    const qtyScrap = Number(body.qtyScrap ?? 0);
    const qtyRework = Number(body.qtyRework ?? 0);
    const notes = body.notes || null;

    if (qtyGood < 0 || qtyScrap < 0 || qtyRework < 0) {
      return NextResponse.json({ error: "Quantités invalides" }, { status: 400 });
    }

    const updated = await prisma.operation.update({
      where: { id: op.id },
      data: {
        status: "TERMINE",
        qtyGood,
        qtyScrap,
        qtyRework,
        notes,
        operatorId: session.id,
        completedAt: new Date(),
        startedAt: op.startedAt || new Date(),
      },
      include: { workCenter: true, operator: true },
    });

    const allOps = await prisma.operation.findMany({ where: { workOrderId: op.workOrderId } });
    const totalScrap = allOps.reduce((s, o) => s + (o.id === updated.id ? qtyScrap : o.qtyScrap), 0);
    const totalRework = allOps.reduce((s, o) => s + (o.id === updated.id ? qtyRework : o.qtyRework), 0);
    const completed = allOps
      .map((o) => (o.id === updated.id ? updated : o))
      .filter((o) => o.status === "TERMINE")
      .sort((a, b) => b.sequence - a.sequence);
    const qtyGoodOf = completed[0]?.qtyGood ?? 0;

    const allDone = allOps.every((o) =>
      o.id === updated.id ? true : o.status === "TERMINE" || o.status === "SKIPPED"
    );

    await prisma.workOrder.update({
      where: { id: op.workOrderId },
      data: {
        qtyGood: qtyGoodOf,
        qtyScrap: totalScrap,
        qtyRework: totalRework,
        status: allDone ? "TERMINE" : "EN_COURS",
        completedAt: allDone ? new Date() : null,
        finishedLot:
          allDone && !op.workOrder.finishedLot
            ? `LOT-FIN-${op.workOrder.number}`
            : op.workOrder.finishedLot,
        startedAt: op.workOrder.startedAt || new Date(),
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
