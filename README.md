# MES Harness — Phase 1 (Oran, Algérie)

Système d'exécution de fabrication (MES) pour une usine pilote de **faisceaux de câbles électriques**.

Flux atelier : **Coupe-Sertissage → Assemblage formboard → Test électrique → Emballage**.

Stack : Next.js 14 (App Router) · TypeScript · Prisma · SQLite · Tailwind CSS.

---

## Démarrage rapide (Linux / macOS)

```bash
cd MES_Harness
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3001](http://localhost:3001) (ou le port indiqué dans `.env` / `.port`).

> **Port :** défaut **3001** (évite Grafana sur 3000). `npm run dev` lit `PORT` via `scripts/dev.mjs`.

### Windows

```powershell
cd MES_Harness
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
npm run dev
```

Le script vérifie Node, crée `.env`, installe les dépendances, applique Prisma + seed, et choisit un port libre parmi **3001, 3002, 3003, 3010**.

Équivalent npm : `npm run setup:win` (nécessite PowerShell).

Mise à jour après `git pull` :

```powershell
npm install
npx prisma db push
npm run db:seed   # optionnel — réinitialise la démo
npm run dev
```

Ou relancer `.\scripts\setup-windows.ps1` (conserve un `.env` existant, réécrit le port libre).

### Scripts utiles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement (port depuis `.env` / `.port`) |
| `npm run build` / `npm start` | Build & prod |
| `npx prisma db push` | Appliquer le schéma SQLite |
| `npm run db:seed` | Charger données démo Oran |
| `npm test` | Tests (transitions OF + scan) |
| `npm run setup:win` | Setup Windows (PowerShell) |
| `npm run db:studio` | Explorateur Prisma |

Fichier base : `prisma/dev.db` (créé par `db push`).

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-in-production"
PORT=3001
```

---

## Comptes démo

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@mes.local` | `admin123` |
| Superviseur | `super@mes.local` | `super123` |
| Opérateur | `operateur@mes.local` | `oper123` |

---

## Nouveautés atelier

### 1. Scan-first (exécution)

Sur **Exécution atelier** : champ scan en tête (douchette clavier / Entrée).

- Scanner `OF-2026-0001` → sélectionne l’OF (toast « OF trouvé », surbrillance).
- Scanner `FIL-…` / `LOT-FIL-…` ou `CONN-…` / `LOT-CONN-…` → remplit lot fil / connecteurs (toast « Lot saisi »), enregistré sur l’OF.
- Saisie manuelle toujours possible. Flash visuel + messages d’erreur si code inconnu.

### 2. Tableau de bord live

Le dashboard se rafraîchit toutes les ~6 s (polling `/api/dashboard`) sans rechargement complet. Indicateur **Mis à jour à HH:MM:SS** et bouton **Pause / Reprendre**. L’exécution atelier a aussi un rafraîchissement WIP léger.

### 3. Setup Windows

`scripts/setup-windows.ps1` + `npm run setup:win` — voir section Windows ci-dessus.

---

## Parcours opérateur (français)

1. Se connecter avec `operateur@mes.local` / `oper123`.
2. **Tableau de bord** : WIP live, OF en retard, rebuts du jour.
3. **Ordres de fab.** : ouvrir `OF-2026-0001` — BOM, lots, opérations.
4. **Exécution** : scanner `OF-2026-0001` (ou cliquer la carte), démarrer / terminer l’opération, saisir quantités. Sur Coupe-Sertissage, scanner un lot `FIL-…` / `CONN-…`.
5. Sur un OF au poste *Test électrique*, enregistrer PASS / FAIL (FAIL → hold).
6. Superviseur (`super@mes.local`) : libérer un hold (`OF-2026-0004`).

---

## Modules Phase 1

- Authentification & rôles (Admin / Superviseur / Opérateur) — session JWT cookie
- Articles + BOM
- Ordres de fabrication (brouillon → lancé → en cours → terminé / annulé + hold)
- Postes atelier configurables (4 postes seedés)
- Exécution : start/complete, qty good/scrap/rework, **scan OF / lots**
- Traçabilité lots (fil, connecteurs, lot fini / série)
- Qualité : pass/fail test électrique + codes motifs + hold/release
- Dashboard WIP / retards / rebuts / débit (**rafraîchissement live**)

Hors périmètre : ERP, PLC, multi-usines, app mobile native, coffre IATF.

---

## Données seed

Usine démo **Oran** — 3 faisceaux (HVAC 24V, kit éclairage 12V, câble batterie), 4 OF ouverts (dont 1 en retard et 1 en hold qualité), lots fil/connecteurs algériens, 4 utilisateurs.

---

## English (short)

Phase 1 MES for an Algerian wire-harness pilot plant (Oran). Run `npm install && npx prisma db push && npm run db:seed && npm run dev`. On Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1`. Demo logins above. French UI primary. Scan-first execution + live dashboard polling. OF / scan covered by `npm test`. Do not commit secrets; `.env` is gitignored.

---

## Licence

Usage interne projet Phase 1 — Samir DJERROUD.
