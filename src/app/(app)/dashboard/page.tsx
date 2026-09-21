import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";
import { DashboardLive, DashboardData } from "./DashboardLive";

export const dynamic = "force-dynamic";

async function loadDashboard(): Promise<DashboardData> {
  const today = startOfDay(new Date());

  const centers = await prisma.workCenter.findMany({
    where: { active: true },
    orderBy: { sequence: "asc" },
    include: {
      operations: {
        where: {
          status: { in: ["EN_COURS", "PENDING"] },
          workOrder: { status: { in: ["LANCE", "EN_COURS", "HOLD"] } },
        },
        include: { workOrder: { include: { article: true } } },
      },
    },
  });

  const openOfs = await prisma.workOrder.findMany({
    where: { status: { in: ["LANCE", "EN_COURS", "HOLD", "BROUILLON"] } },
    include: { article: true },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });

  const lateOfs = openOfs.filter(
    (o) => o.dueDate && o.dueDate < new Date() && o.status !== "BROUILLON"
  );

  const opsToday = await prisma.operation.findMany({
    where: { completedAt: { gte: today }, status: "TERMINE" },
  });
  const scrapToday = opsToday.reduce((s, o) => s + o.qtyScrap, 0);
  const throughputToday = opsToday.reduce((s, o) => s + o.qtyGood, 0);

  return {
    updatedAt: new Date().toISOString(),
    openCount: openOfs.length,
    holdCount: openOfs.filter((o) => o.status === "HOLD").length,
    scrapToday,
    throughputToday,
    lateOfs: lateOfs.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      dueDate: o.dueDate?.toISOString() ?? null,
      article: o.article.partNumber,
    })),
    wipByPoste: centers.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      enCours: c.operations.filter((o) => o.status === "EN_COURS").length,
      enAttente: c.operations.filter((o) => o.status === "PENDING").length,
      operations: c.operations
        .filter((o) => o.status === "EN_COURS")
        .map((o) => ({
          id: o.id,
          workOrderId: o.workOrderId,
          of: o.workOrder.number,
          article: o.workOrder.article.partNumber,
          qty: o.workOrder.quantity,
        })),
    })),
  };
}

export default async function DashboardPage() {
  const initial = await loadDashboard();
  return <DashboardLive initial={initial} />;
}
