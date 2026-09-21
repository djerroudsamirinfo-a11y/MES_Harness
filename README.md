# MES Harness — Phase 1 (Oran, Algérie)

Système d'exécution de fabrication (MES) pour une usine pilote de **faisceaux de câbles électriques**.

Flux atelier : **Coupe-Sertissage → Assemblage formboard → Test électrique → Emballage**.

Stack : Next.js 14 (App Router) · TypeScript · Prisma · SQLite · Tailwind CSS.

---

## Démarrage rapide

```bash
cd /workspace/MES_Harness
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Scripts utiles

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build & prod |
| `npx prisma db push` | Appliquer le schéma SQLite |
| `npm run db:seed` | Charger données démo Oran |
| `npm test` | Tests transitions OF |
| `npm run db:studio` | Explorateur Prisma |

Fichier base : `prisma/dev.db` (créé par `db push`).

Variable d'environnement (voir `.env.example`) :

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-in-production"
```

---

## Comptes démo

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@mes.local` | `admin123` |
| Superviseur | `super@mes.local` | `super123` |
| Opérateur | `operateur@mes.local` | `oper123` |

---

## Parcours opérateur (français)

1. Se connecter avec `operateur@mes.local` / `oper123`.
2. **Tableau de bord** : voir le WIP par poste, OF en retard, rebuts du jour.
3. **Ordres de fab.** : ouvrir `OF-2026-0001` (en cours) — consulter BOM, lots fil/connecteurs, opérations.
4. **Exécution** : démarrer l'opération *Assemblage formboard*, saisir quantités bon/rebut/retouche, terminer.
5. Sur un OF au poste *Test électrique*, enregistrer un test **PASS** ou **FAIL** (un FAIL met l'OF en hold).
6. Superviseur (`super@mes.local`) : libérer un hold (`OF-2026-0004`) via Actions statut → *En cours* / *Lancé*.

---

## Modules Phase 1

- Authentification & rôles (Admin / Superviseur / Opérateur) — session JWT cookie
- Articles + BOM
- Ordres de fabrication (brouillon → lancé → en cours → terminé / annulé + hold)
- Postes atelier configurables (4 postes seedés)
- Exécution : start/complete, qty good/scrap/rework, opérateur, horodatage
- Traçabilité lots (fil, connecteurs, lot fini / série)
- Qualité : pass/fail test électrique + codes motifs + hold/release
- Dashboard WIP / retards / rebuts / débit

Hors périmètre : ERP, PLC, multi-usines, app mobile native, coffre IATF.

---

## Données seed

Usine démo **Oran** — 3 faisceaux (HVAC 24V, kit éclairage 12V, câble batterie), 4 OF ouverts (dont 1 en retard et 1 en hold qualité), lots fil/connecteurs algériens, 4 utilisateurs.

---

## English (short)

Phase 1 MES for an Algerian wire-harness pilot plant (Oran). Run `npm install && npx prisma db push && npm run db:seed && npm run dev`. Demo logins above. French UI primary. OF state-machine covered by `npm test`. Do not commit secrets; `.env` is gitignored.

---

## Licence

Usage interne projet Phase 1 — Samir DJERROUD.
