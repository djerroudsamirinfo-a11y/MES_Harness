import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { classifyScan } from "@/lib/scan";

/** Résout un code barre scanné : OF ou suggestion de lot. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  if (!code) {
    return NextResponse.json({ error: "Code vide" }, { status: 400 });
  }

  const classified = classifyScan(code);

  if (classified.kind === "of") {
    const of = await prisma.workOrder.findUnique({
      where: { number: classified.value },
      include: {
        article: true,
        operations: {
          include: { workCenter: true },
          orderBy: { sequence: "asc" },
        },
      },
    });
    if (!of) {
      return NextResponse.json(
        { ok: false, kind: "of", error: "OF inconnu", code: classified.value },
        { status: 404 }
      );
    }
    const activeOp = of.operations.find((o) => o.status === "EN_COURS")
      || of.operations.find((o) => o.status === "PENDING");
    return NextResponse.json({
      ok: true,
      kind: "of",
      workOrder: {
        id: of.id,
        number: of.number,
        status: of.status,
        wireLot: of.wireLot,
        connectorLot: of.connectorLot,
        article: of.article.partNumber,
        quantity: of.quantity,
      },
      activeOperation: activeOp
        ? {
            id: activeOp.id,
            status: activeOp.status,
            workCenterCode: activeOp.workCenter.code,
            workCenterName: activeOp.workCenter.name,
            sequence: activeOp.sequence,
          }
        : null,
    });
  }

  if (classified.kind === "wire" || classified.kind === "connector") {
    return NextResponse.json({
      ok: true,
      kind: classified.kind,
      value: classified.value,
      field: classified.kind === "wire" ? "wireLot" : "connectorLot",
    });
  }

  return NextResponse.json({
    ok: true,
    kind: "unknown",
    value: classified.value,
  });
}
