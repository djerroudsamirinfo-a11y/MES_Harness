import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MES Harness — Oran Phase 1",
  description: "Système d'exécution de fabrication — faisceaux électriques Algérie",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
