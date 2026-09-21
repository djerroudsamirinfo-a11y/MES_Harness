export type ScanKind = "of" | "wire" | "connector" | "unknown";

export type ScanClassification = {
  kind: ScanKind;
  value: string;
};

/**
 * Classifie un code scanné (clavier / douchette) pour l'exécution atelier.
 * Préfixes reconnus : OF-, FIL- / LOT-FIL-, CONN- / LOT-CONN- / LOT-H4-
 */
export function classifyScan(raw: string): ScanClassification {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "unknown", value: "" };

  const upper = trimmed.toUpperCase();

  if (/^OF[-_]?\d/i.test(trimmed) || /^OF-/i.test(trimmed)) {
    return {
      kind: "of",
      value: upper.replace(/_/g, "-"),
    };
  }

  if (/^(FIL-|LOT-FIL-)/i.test(trimmed)) {
    return { kind: "wire", value: trimmed };
  }

  if (/^(CONN-|LOT-CONN-|LOT-H4-)/i.test(trimmed)) {
    return { kind: "connector", value: trimmed };
  }

  return { kind: "unknown", value: trimmed };
}

/** Assigne un lot au champ fil / connecteur selon préfixe ou prochain champ vide. */
export function assignLotFields(
  code: string,
  current: { wireLot: string; connectorLot: string },
  focused?: "wire" | "connector" | null
): { wireLot: string; connectorLot: string; field: "wire" | "connector" } | null {
  const { kind, value } = classifyScan(code);
  if (!value) return null;

  if (kind === "wire" || focused === "wire") {
    return {
      wireLot: value,
      connectorLot: current.connectorLot,
      field: "wire",
    };
  }
  if (kind === "connector" || focused === "connector") {
    return {
      wireLot: current.wireLot,
      connectorLot: value,
      field: "connector",
    };
  }

  // Inconnu : prochain champ vide, sinon fil
  if (!current.wireLot) {
    return { wireLot: value, connectorLot: current.connectorLot, field: "wire" };
  }
  if (!current.connectorLot) {
    return { wireLot: current.wireLot, connectorLot: value, field: "connector" };
  }
  return { wireLot: value, connectorLot: current.connectorLot, field: "wire" };
}
