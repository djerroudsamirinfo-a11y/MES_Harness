import { prisma } from "@/lib/prisma";
import { ExecutionFloor } from "./ExecutionFloor";

export const dynamic = "force-dynamic";

export default async function ExecutionPage() {
  const centers = await prisma.workCenter.findMany({
    where: { active: true },
    orderBy: { sequence: "asc" },
  });

  const operations = await prisma.operation.findMany({
    where: {
      status: { in: ["PENDING", "EN_COURS"] },
      workOrder: { status: { in: ["LANCE", "EN_COURS"] } },
    },
    include: {
      workCenter: true,
      workOrder: { include: { article: true } },
      operator: true,
    },
    orderBy: [{ workCenter: { sequence: "asc" } }, { workOrder: { priority: "asc" } }],
  });

  const serialized = operations.map((op) => ({
    id: op.id,
    status: op.status,
    qtyGood: op.qtyGood,
    qtyScrap: op.qtyScrap,
    qtyRework: op.qtyRework,
    workCenterId: op.workCenterId,
    workCenter: {
      id: op.workCenter.id,
      code: op.workCenter.code,
      name: op.workCenter.name,
      sequence: op.workCenter.sequence,
    },
    workOrder: {
      id: op.workOrder.id,
      number: op.workOrder.number,
      status: op.workOrder.status,
      quantity: op.workOrder.quantity,
      wireLot: op.workOrder.wireLot,
      connectorLot: op.workOrder.connectorLot,
      article: {
        partNumber: op.workOrder.article.partNumber,
        designation: op.workOrder.article.designation,
      },
    },
  }));

  return (
    <ExecutionFloor
      initialOperations={serialized}
      centers={centers.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        sequence: c.sequence,
      }))}
    />
  );
}
