import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const list = await prisma.workOrder.findMany({
    include: { article: true, operations: { include: { workCenter: true } } },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.role === "OPERATEUR") {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const body = await req.json();
  const articleId = body.articleId as string;
  const quantity = Number(body.quantity);
  const priority = Number(body.priority || 5);
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const notes = body.notes || null;

  if (!articleId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Article et quantité requis" }, { status: 400 });
  }

  const count = await prisma.workOrder.count();
  const number = `OF-2026-${String(count + 1).padStart(4, "0")}`;
  const centers = await prisma.workCenter.findMany({
    where: { active: true },
    orderBy: { sequence: "asc" },
  });

  const of = await prisma.workOrder.create({
    data: {
      number,
      articleId,
      quantity,
      priority,
      dueDate,
      notes,
      status: "BROUILLON",
      operations: {
        create: centers.map((c) => ({
          workCenterId: c.id,
          sequence: c.sequence,
        })),
      },
    },
    include: { article: true, operations: true },
  });
  return NextResponse.json(of, { status: 201 });
}
