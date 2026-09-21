export const WORK_CENTER_SEED = [
  {
    code: "COUPE_SERT",
    name: "Coupe-Sertissage",
    description: "Coupe, dénudage et sertissage des fils",
    sequence: 1,
  },
  {
    code: "ASSEMB_FB",
    name: "Assemblage formboard",
    description: "Montage sur planche de formage, rubanage",
    sequence: 2,
  },
  {
    code: "TEST_ELEC",
    name: "Test électrique",
    description: "Continuité, court-circuit, polarité",
    sequence: 3,
  },
  {
    code: "EMBALLAGE",
    name: "Emballage",
    description: "Étiquetage, conditionnement et expédition",
    sequence: 4,
  },
] as const;

export const REASON_CODES_SEED = [
  { code: "CONT_OUVERT", label: "Circuit ouvert / continuité", category: "QUALITE" },
  { code: "COURT_CIRCUIT", label: "Court-circuit", category: "QUALITE" },
  { code: "MAUV_CAB", label: "Mauvais câblage / polarité", category: "QUALITE" },
  { code: "CRIMP_DEF", label: "Sertissage défectueux", category: "QUALITE" },
  { code: "LONG_HORS_TOL", label: "Longueur hors tolérance", category: "QUALITE" },
  { code: "CONN_CASSE", label: "Connecteur endommagé", category: "QUALITE" },
  { code: "COSMETIQUE", label: "Défaut cosmétique / rubanage", category: "QUALITE" },
  { code: "AUTRE", label: "Autre", category: "QUALITE" },
] as const;

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR");
}
