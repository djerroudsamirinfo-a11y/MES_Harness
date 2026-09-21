export type OfStatus =
  | "BROUILLON"
  | "LANCE"
  | "EN_COURS"
  | "TERMINE"
  | "ANNULE"
  | "HOLD";

export const OF_STATUS_LABELS: Record<OfStatus, string> = {
  BROUILLON: "Brouillon",
  LANCE: "Lancé",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
  HOLD: "En hold",
};

export const OF_STATUS_COLORS: Record<OfStatus, string> = {
  BROUILLON: "bg-slate-100 text-slate-700",
  LANCE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-amber-100 text-amber-800",
  TERMINE: "bg-emerald-100 text-emerald-800",
  ANNULE: "bg-red-100 text-red-800",
  HOLD: "bg-orange-100 text-orange-900",
};

/** Allowed transitions (excluding HOLD which can apply from active states). */
const TRANSITIONS: Record<OfStatus, OfStatus[]> = {
  BROUILLON: ["LANCE", "ANNULE"],
  LANCE: ["EN_COURS", "ANNULE", "HOLD"],
  EN_COURS: ["TERMINE", "ANNULE", "HOLD"],
  TERMINE: [],
  ANNULE: [],
  HOLD: ["LANCE", "EN_COURS", "ANNULE"],
};

export function canTransition(from: OfStatus, to: OfStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OfStatus, to: OfStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transition OF invalide : ${OF_STATUS_LABELS[from]} → ${OF_STATUS_LABELS[to]}`
    );
  }
}

export function launchOf(status: OfStatus): OfStatus {
  assertTransition(status, "LANCE");
  return "LANCE";
}

export function startOf(status: OfStatus): OfStatus {
  assertTransition(status, "EN_COURS");
  return "EN_COURS";
}

export function completeOf(status: OfStatus): OfStatus {
  assertTransition(status, "TERMINE");
  return "TERMINE";
}

export function cancelOf(status: OfStatus): OfStatus {
  assertTransition(status, "ANNULE");
  return "ANNULE";
}

export function holdOf(status: OfStatus): OfStatus {
  assertTransition(status, "HOLD");
  return "HOLD";
}

export function releaseOf(status: OfStatus, previousActive: "LANCE" | "EN_COURS" = "EN_COURS"): OfStatus {
  if (status !== "HOLD") {
    throw new Error("Seul un OF en hold peut être libéré");
  }
  assertTransition(status, previousActive);
  return previousActive;
}

export function nextAllowed(status: OfStatus): OfStatus[] {
  return TRANSITIONS[status] ?? [];
}
