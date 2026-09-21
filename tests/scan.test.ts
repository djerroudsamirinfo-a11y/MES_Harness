import { describe, it, expect } from "vitest";
import { classifyScan, assignLotFields } from "../src/lib/scan";

describe("classifyScan", () => {
  it("détecte un numéro OF", () => {
    expect(classifyScan("OF-2026-0001")).toEqual({ kind: "of", value: "OF-2026-0001" });
    expect(classifyScan("of-2026-0002")).toEqual({ kind: "of", value: "OF-2026-0002" });
  });

  it("détecte lot fil", () => {
    expect(classifyScan("FIL-ORAN-01").kind).toBe("wire");
    expect(classifyScan("LOT-FIL-ORAN-0926-A").kind).toBe("wire");
  });

  it("détecte lot connecteur", () => {
    expect(classifyScan("CONN-DT-8841").kind).toBe("connector");
    expect(classifyScan("LOT-CONN-DT-8841").kind).toBe("connector");
    expect(classifyScan("LOT-H4-2201").kind).toBe("connector");
  });

  it("inconnu sinon", () => {
    expect(classifyScan("XYZ-123").kind).toBe("unknown");
    expect(classifyScan("").kind).toBe("unknown");
  });
});

describe("assignLotFields", () => {
  it("remplit fil via préfixe", () => {
    const r = assignLotFields("FIL-A", { wireLot: "", connectorLot: "" });
    expect(r?.field).toBe("wire");
    expect(r?.wireLot).toBe("FIL-A");
  });

  it("remplit le prochain champ vide pour code inconnu", () => {
    const r = assignLotFields("ABC-99", { wireLot: "FIL-1", connectorLot: "" });
    expect(r?.field).toBe("connector");
    expect(r?.connectorLot).toBe("ABC-99");
  });
});
