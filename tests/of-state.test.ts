import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  launchOf,
  startOf,
  completeOf,
  cancelOf,
  holdOf,
  releaseOf,
  nextAllowed,
} from "../src/lib/of-state";

describe("Transitions OF (ordres de fabrication)", () => {
  it("brouillon → lancé", () => {
    expect(canTransition("BROUILLON", "LANCE")).toBe(true);
    expect(launchOf("BROUILLON")).toBe("LANCE");
  });

  it("lancé → en cours", () => {
    expect(startOf("LANCE")).toBe("EN_COURS");
  });

  it("en cours → terminé", () => {
    expect(completeOf("EN_COURS")).toBe("TERMINE");
  });

  it("refuse terminé → lancé", () => {
    expect(canTransition("TERMINE", "LANCE")).toBe(false);
    expect(() => assertTransition("TERMINE", "LANCE")).toThrow(/invalide/);
  });

  it("refuse brouillon → terminé (saut)", () => {
    expect(canTransition("BROUILLON", "TERMINE")).toBe(false);
  });

  it("annulation depuis brouillon / lancé / en cours", () => {
    expect(cancelOf("BROUILLON")).toBe("ANNULE");
    expect(cancelOf("LANCE")).toBe("ANNULE");
    expect(cancelOf("EN_COURS")).toBe("ANNULE");
  });

  it("hold depuis lancé ou en cours", () => {
    expect(holdOf("LANCE")).toBe("HOLD");
    expect(holdOf("EN_COURS")).toBe("HOLD");
    expect(canTransition("BROUILLON", "HOLD")).toBe(false);
  });

  it("libération hold → en cours ou lancé", () => {
    expect(releaseOf("HOLD", "EN_COURS")).toBe("EN_COURS");
    expect(releaseOf("HOLD", "LANCE")).toBe("LANCE");
    expect(() => releaseOf("EN_COURS")).toThrow(/hold/);
  });

  it("nextAllowed expose les cibles valides", () => {
    expect(nextAllowed("BROUILLON")).toEqual(["LANCE", "ANNULE"]);
    expect(nextAllowed("TERMINE")).toEqual([]);
  });
});
