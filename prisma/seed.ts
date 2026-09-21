import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { WORK_CENTER_SEED, REASON_CODES_SEED } from "../src/lib/labels";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed MES Harness — usine pilote Oran…");

  await prisma.qualityTest.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.bomLine.deleteMany();
  await prisma.article.deleteMany();
  await prisma.workCenter.deleteMany();
  await prisma.reasonCode.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("admin123", 10);
  const superHash = await bcrypt.hash("super123", 10);
  const operHash = await bcrypt.hash("oper123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@mes.local",
      name: "Amine Benali",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  const superv = await prisma.user.create({
    data: {
      email: "super@mes.local",
      name: "Fatima Zahra",
      passwordHash: superHash,
      role: "SUPERVISEUR",
    },
  });
  const oper = await prisma.user.create({
    data: {
      email: "operateur@mes.local",
      name: "Karim Meziane",
      passwordHash: operHash,
      role: "OPERATEUR",
    },
  });
  const oper2 = await prisma.user.create({
    data: {
      email: "sara@mes.local",
      name: "Sara Bouaziz",
      passwordHash: operHash,
      role: "OPERATEUR",
    },
  });

  for (const wc of WORK_CENTER_SEED) {
    await prisma.workCenter.create({ data: { ...wc } });
  }
  const centers = await prisma.workCenter.findMany({ orderBy: { sequence: "asc" } });

  for (const rc of REASON_CODES_SEED) {
    await prisma.reasonCode.create({ data: { ...rc } });
  }

  const art1 = await prisma.article.create({
    data: {
      partNumber: "FH-HVAC-24V-01",
      designation: "Faisceau HVAC 24V — armoire industrielle",
      revision: "B",
      description: "Faisceau ramifié pour unité HVAC, 8 voies, gaine spiralée",
      bomLines: {
        create: [
          { lineNumber: 10, componentPn: "FIL-FLRY-1.0-RD", designation: "Fil FLRY 1,0 mm² rouge", quantity: 12.5, unit: "m" },
          { lineNumber: 20, componentPn: "FIL-FLRY-1.0-BK", designation: "Fil FLRY 1,0 mm² noir", quantity: 12.5, unit: "m" },
          { lineNumber: 30, componentPn: "FIL-FLRY-0.5-YE", designation: "Fil FLRY 0,5 mm² jaune", quantity: 8.0, unit: "m" },
          { lineNumber: 40, componentPn: "CONN-DT06-08SA", designation: "Connecteur DT 8 voies femelle", quantity: 1, unit: "pcs" },
          { lineNumber: 50, componentPn: "TERM-16-14AWG", designation: "Borne sertissage 16-14 AWG", quantity: 16, unit: "pcs" },
          { lineNumber: 60, componentPn: "TAPE-PVC-19", designation: "Ruban PVC 19 mm", quantity: 3.0, unit: "m" },
        ],
      },
    },
  });

  const art2 = await prisma.article.create({
    data: {
      partNumber: "FH-LIGHT-12V-AM",
      designation: "Kit faisceau éclairage 12V après-vente",
      revision: "A",
      description: "Kit phare / clignotant pour parc automobile algérien",
      bomLines: {
        create: [
          { lineNumber: 10, componentPn: "FIL-PVC-0.75-RD", designation: "Fil PVC 0,75 mm² rouge", quantity: 4.0, unit: "m" },
          { lineNumber: 20, componentPn: "FIL-PVC-0.75-BK", designation: "Fil PVC 0,75 mm² noir", quantity: 4.0, unit: "m" },
          { lineNumber: 30, componentPn: "CONN-H4-M", designation: "Connecteur H4 mâle", quantity: 2, unit: "pcs" },
          { lineNumber: 40, componentPn: "TERM-FASTON-6.3", designation: "Cosse Faston 6,3 mm", quantity: 8, unit: "pcs" },
        ],
      },
    },
  });

  const art3 = await prisma.article.create({
    data: {
      partNumber: "CB-BATT-35-GND",
      designation: "Câble batterie / masse 35 mm²",
      revision: "A",
      description: "Câble puissance avec cosses à œillet M8/M10",
      bomLines: {
        create: [
          { lineNumber: 10, componentPn: "FIL-CU-35-BK", designation: "Câble cuivre 35 mm² noir", quantity: 1.2, unit: "m" },
          { lineNumber: 20, componentPn: "LUG-M8-35", designation: "Cosse œillet M8 35 mm²", quantity: 1, unit: "pcs" },
          { lineNumber: 30, componentPn: "LUG-M10-35", designation: "Cosse œillet M10 35 mm²", quantity: 1, unit: "pcs" },
          { lineNumber: 40, componentPn: "HS-25-BK", designation: "Gaine thermo 25 mm", quantity: 0.15, unit: "m" },
        ],
      },
    },
  });

  async function createOf(opts: {
    number: string;
    articleId: string;
    qty: number;
    status: string;
    priority: number;
    dueDays: number;
    wireLot?: string;
    connectorLot?: string;
    finishedLot?: string;
    ops?: { seq: number; status: string; good?: number; scrap?: number; opId?: string }[];
  }) {
    const due = new Date();
    due.setDate(due.getDate() + opts.dueDays);
    const of = await prisma.workOrder.create({
      data: {
        number: opts.number,
        articleId: opts.articleId,
        quantity: opts.qty,
        status: opts.status,
        priority: opts.priority,
        dueDate: due,
        wireLot: opts.wireLot,
        connectorLot: opts.connectorLot,
        finishedLot: opts.finishedLot,
        launchedAt: opts.status !== "BROUILLON" ? new Date() : null,
        startedAt: ["EN_COURS", "TERMINE", "HOLD"].includes(opts.status) ? new Date() : null,
        qtyGood: opts.ops?.reduce((s, o) => s + (o.good || 0), 0) || 0,
        qtyScrap: opts.ops?.reduce((s, o) => s + (o.scrap || 0), 0) || 0,
      },
    });

    for (const c of centers) {
      const opDef = opts.ops?.find((o) => o.seq === c.sequence);
      await prisma.operation.create({
        data: {
          workOrderId: of.id,
          workCenterId: c.id,
          sequence: c.sequence,
          status: opDef?.status ?? "PENDING",
          qtyGood: opDef?.good ?? 0,
          qtyScrap: opDef?.scrap ?? 0,
          operatorId: opDef?.opId ?? null,
          startedAt: opDef && opDef.status !== "PENDING" ? new Date() : null,
          completedAt: opDef?.status === "TERMINE" ? new Date() : null,
        },
      });
    }
    return of;
  }

  await createOf({
    number: "OF-2026-0001",
    articleId: art1.id,
    qty: 50,
    status: "EN_COURS",
    priority: 2,
    dueDays: 2,
    wireLot: "LOT-FIL-ORAN-0926-A",
    connectorLot: "LOT-CONN-DT-8841",
    ops: [
      { seq: 1, status: "TERMINE", good: 50, scrap: 2, opId: oper.id },
      { seq: 2, status: "EN_COURS", good: 20, opId: oper2.id },
      { seq: 3, status: "PENDING" },
      { seq: 4, status: "PENDING" },
    ],
  });

  await createOf({
    number: "OF-2026-0002",
    articleId: art2.id,
    qty: 100,
    status: "LANCE",
    priority: 3,
    dueDays: -1,
    wireLot: "LOT-FIL-SETIF-0918-B",
    connectorLot: "LOT-H4-2201",
  });

  await createOf({
    number: "OF-2026-0003",
    articleId: art3.id,
    qty: 30,
    status: "BROUILLON",
    priority: 5,
    dueDays: 7,
  });

  await createOf({
    number: "OF-2026-0004",
    articleId: art1.id,
    qty: 25,
    status: "HOLD",
    priority: 1,
    dueDays: 1,
    wireLot: "LOT-FIL-ORAN-0920-C",
    connectorLot: "LOT-CONN-DT-8710",
    ops: [
      { seq: 1, status: "TERMINE", good: 25, scrap: 1, opId: oper.id },
      { seq: 2, status: "TERMINE", good: 24, scrap: 1, opId: oper2.id },
      { seq: 3, status: "EN_COURS", good: 0, scrap: 3, opId: oper.id },
      { seq: 4, status: "PENDING" },
    ],
  });

  const holdOf = await prisma.workOrder.findUnique({ where: { number: "OF-2026-0004" } });
  if (holdOf) {
    await prisma.workOrder.update({
      where: { id: holdOf.id },
      data: { holdReason: "Échec test électrique — court-circuit détecté", qtyScrap: 3 },
    });
    await prisma.qualityTest.create({
      data: {
        workOrderId: holdOf.id,
        result: "FAIL",
        reasonCode: "COURT_CIRCUIT",
        reasonText: "Court-circuit entre voies 3 et 5",
        testedById: superv.id,
        qtyTested: 3,
      },
    });
  }

  console.log("✅ Seed terminé");
  console.log("   Utilisateurs: admin@mes.local / super@mes.local / operateur@mes.local");
  console.log(`   Articles: 3 | OF: 4 | Postes: ${centers.length}`);
  console.log(`   Admin id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
