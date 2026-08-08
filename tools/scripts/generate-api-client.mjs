#!/usr/bin/env node
/**
 * Export OpenAPI from Bee API and generate @bee/api-client types.
 *
 * Usage:
 *   node tools/scripts/generate-api-client.mjs
 *   node tools/scripts/generate-api-client.mjs --check
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const openapiPath = path.join(root, "packages/api-client/openapi.json");
const generatedPath = path.join(root, "packages/api-client/src/generated/schema.ts");
const check = process.argv.includes("--check");

mkdirSync(path.dirname(generatedPath), { recursive: true });

const exportPy = `
import json
from bee_api.main import app
print(json.dumps(app.openapi()))
`;

const py = path.join(root, ".venv/bin/python");
const pythonBin = existsSync(py) ? py : "python3";
const exported = spawnSync(pythonBin, ["-c", exportPy], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, PYTHONPATH: "" },
});

if (exported.status !== 0) {
  console.error(exported.stderr || exported.stdout);
  console.error("Failed to export OpenAPI. Activate .venv and install bee packages first.");
  process.exit(1);
}

const openapiJson = exported.stdout.trim();
const previous = existsSync(openapiPath) ? readFileSync(openapiPath, "utf8") : "";

if (check) {
  const prevHash = createHash("sha256").update(previous).digest("hex");
  const nextHash = createHash("sha256").update(openapiJson + "\n").digest("hex");
  if (prevHash !== nextHash) {
    console.error("OpenAPI drift detected. Run: pnpm codegen");
    process.exit(1);
  }
}

writeFileSync(openapiPath, openapiJson + "\n");

const gen = spawnSync(
  "pnpm",
  ["exec", "openapi-typescript", openapiPath, "-o", generatedPath],
  { cwd: root, encoding: "utf8" }
);

if (gen.status !== 0) {
  console.error(gen.stderr || gen.stdout);
  process.exit(1);
}

// thin wrappers note file
const wrappers = path.join(root, "packages/api-client/src/generated/README.md");
writeFileSync(
  wrappers,
  "# Generated OpenAPI types\n\nDo not edit `schema.ts` by hand. Run `pnpm codegen` from the repo root.\n"
);

console.log(`Wrote ${path.relative(root, openapiPath)}`);
console.log(`Wrote ${path.relative(root, generatedPath)}`);
