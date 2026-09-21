import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const workOrderId = body.workOrderId as string;
  const result = body.result as "PASS" | "FAIL";
  const reasonCode = body.reasonCode || null;
  const reasonText = body.reasonText || null;
  const qtyTested = Number(body.qtyTested || 1);
  const autoHold = body.autoHold !== false;

  const of = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!of) return NextResponse.json({ error: "OF introuvable" }, { status: 404 });

  const test = await prisma.qualityTest.create({
    data: {
      workOrderId,
      result,
      reasonCode,
      reasonText,
      qtyTested,
      testedById: session.id,
      notes: body.notes || null,
    },
  });

  if (result === "FAIL" && autoHold && of.status !== "ANNULE" && of.status !== "TERMINE") {
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        status: "HOLD",
        holdReason: reasonText || reasonCode || "Échec test qualité",
        qtyScrap: of.qtyScrap + qtyTested,
      },
    });
  }

  return NextResponse.json(test, { status: 201 });
}

export async function GET() {
  const codes = await prisma.reasonCode.findMany({ where: { active: true }, orderBy: { code: "asc" } });
  return NextResponse.json(codes);
}
