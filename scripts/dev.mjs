#!/usr/bin/env node
/**
 * Lance Next.js en lisant PORT depuis process.env, .env, ou .port (défaut 3001).
 * Si le port est occupé, essaie 3002, 3003, 3010.
 * Usage: node scripts/dev.mjs   |   node scripts/dev.mjs start
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const mode = process.argv[2] === "start" ? "start" : "dev";
const CANDIDATES = [3001, 3002, 3003, 3010];

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function preferredPort() {
  if (process.env.PORT) return String(process.env.PORT);
  const env = { ...readEnvFile(resolve(root, ".env")), ...readEnvFile(resolve(root, ".env.local")) };
  if (env.PORT) return String(env.PORT);
  const portFile = resolve(root, ".port");
  if (existsSync(portFile)) {
    const p = readFileSync(portFile, "utf8").trim();
    if (p) return p;
  }
  return "3001";
}

function isPortFree(port) {
  return new Promise((resolvePromise) => {
    const server = createServer();
    server.unref();
    server.on("error", () => resolvePromise(false));
    server.listen(Number(port), "0.0.0.0", () => {
      server.close(() => resolvePromise(true));
    });
  });
}

async function resolvePort() {
  const preferred = preferredPort();
  const ordered = [Number(preferred), ...CANDIDATES.filter((p) => p !== Number(preferred))];
  for (const p of ordered) {
    if (await isPortFree(p)) {
      if (String(p) !== preferred) {
        console.log(`[mes] port ${preferred} occupé — bascule sur ${p}`);
        try {
          writeFileSync(resolve(root, ".port"), String(p));
        } catch {
          /* ignore */
        }
      }
      return String(p);
    }
  }
  console.error(`[mes] aucun port libre parmi: ${ordered.join(", ")}`);
  process.exit(1);
}

const port = await resolvePort();
const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const args = [nextBin, mode, "-p", port];

console.log(`[mes] next ${mode} — port ${port}`);
console.log(`[mes] ouvrir http://localhost:${port}`);

const child = spawn(process.execPath, args, {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: port },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
