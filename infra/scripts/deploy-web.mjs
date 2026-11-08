#!/usr/bin/env node
// Build content + web app and deploy the Bearerchum edge Worker.   node infra/scripts/deploy-web.mjs
import { execSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const run = (cmd, cwd = root) => { console.log(`\n$ ${cmd}`); execSync(cmd, { cwd, stdio: "inherit" }); };

run("python tools/build_content.py --strict");
run("npm ci --no-audit --no-fund", path.join(root, "apps/web"));
run("npm run build", path.join(root, "apps/web"));
copyFileSync(path.join(root, "reviewer/CodeBearers_NPC2026_Python_Reviewer.pdf"), path.join(root, "apps/web/dist/reviewer.pdf"));
run("npx --yes wrangler@4 deploy --config infra/cloudflare/web/wrangler.jsonc");
