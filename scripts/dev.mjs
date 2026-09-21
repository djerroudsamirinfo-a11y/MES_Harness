#!/usr/bin/env node
/**
 * Lance Next.js en lisant PORT depuis process.env, .env, ou .port (défaut 3001).
 * Usage: node scripts/dev.mjs   |   node scripts/dev.mjs start
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const mode = process.argv[2] === "start" ? "start" : "dev";

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

function resolvePort() {
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

const port = resolvePort();
const nextBin = resolve(root, "node_modules", "next", "dist", "bin", "next");
const args = [nextBin, mode, "-p", port];

console.log(`[mes] next ${mode} — port ${port}`);

const child = spawn(process.execPath, args, {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: port },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
