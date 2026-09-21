import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { assertTransition, OfStatus } from "@/lib/of-state";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
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
  if (!of) return NextResponse.json({ error: "OF introuvable" }, { status: 404 });
  return NextResponse.json(of);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const of = await prisma.workOrder.findUnique({ where: { id: params.id } });
  if (!of) return NextResponse.json({ error: "OF introuvable" }, { status: 404 });

  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "transition") {
      const to = body.to as OfStatus;
      assertTransition(of.status as OfStatus, to);
      const data: Record<string, unknown> = { status: to };
      if (to === "LANCE") data.launchedAt = new Date();
      if (to === "EN_COURS" && !of.startedAt) data.startedAt = new Date();
      if (to === "TERMINE") {
        data.completedAt = new Date();
        if (!of.finishedLot) {
          data.finishedLot = `LOT-FIN-${of.number}`;
        }
      }
      if (to === "HOLD") data.holdReason = body.holdReason || "Hold qualité";
      if (to !== "HOLD" && of.status === "HOLD") data.holdReason = null;

      if (session.role === "OPERATEUR" && (to === "ANNULE" || to === "BROUILLON")) {
        return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
      }

      const updated = await prisma.workOrder.update({
        where: { id: of.id },
        data,
      });
      return NextResponse.json(updated);
    }

    if (action === "updateTrace") {
      const updated = await prisma.workOrder.update({
        where: { id: of.id },
        data: {
          wireLot: body.wireLot ?? of.wireLot,
          connectorLot: body.connectorLot ?? of.connectorLot,
          finishedLot: body.finishedLot ?? of.finishedLot,
          serialStart: body.serialStart ?? of.serialStart,
        },
      });
      return NextResponse.json(updated);
    }

    if (action === "updateMeta") {
      if (session.role === "OPERATEUR") {
        return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
      }
      const updated = await prisma.workOrder.update({
        where: { id: of.id },
        data: {
          priority: body.priority !== undefined ? Number(body.priority) : of.priority,
          dueDate: body.dueDate ? new Date(body.dueDate) : of.dueDate,
          notes: body.notes !== undefined ? body.notes : of.notes,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
