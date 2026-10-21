// Copies the server secrets to Vercel (Production). Secrets are stored as Sensitive.
//
//   node scripts/push-vercel-secrets.mjs
//     DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_KEY, RESEND_API_KEY  ← from .env.local (empty ones are skipped)
//     FIREBASE_SERVICE_ACCOUNT_JSON                                     ← from ../irewin_dashboard/service-account.json
//
//   node scripts/push-vercel-secrets.mjs --live
//     Switches Production to live Dodo payments, from .env.live.local:
//     DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_KEY (sensitive), DODO_PAYMENTS_ENVIRONMENT,
//     DODO_PRODUCT_1W, DODO_PRODUCT_3M, NEXT_PUBLIC_DODO_TEST_MODE. All must be set, so
//     Production is never left half test, half live.
//
// Values are sent to the Vercel CLI on stdin, never printed or put on the command line.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const live = process.argv.includes("--live");
const ENV_FILE = live ? ".env.live.local" : ".env.local";
const SERVICE_ACCOUNT = "../irewin_dashboard/service-account.json";

const envFile = readFileSync(ENV_FILE, "utf-8");
const read = (name) => envFile.match(new RegExp(`^${name}=(.+)$`, "m"))?.[1]?.trim();

// [name, value, sensitive]
const vars = [];
if (live) {
  const wanted = [
    ["DODO_PAYMENTS_API_KEY", true],
    ["DODO_PAYMENTS_WEBHOOK_KEY", true],
    ["DODO_PAYMENTS_ENVIRONMENT", false],
    ["DODO_PRODUCT_1W", false],
    ["DODO_PRODUCT_3M", false],
    ["NEXT_PUBLIC_DODO_TEST_MODE", false],
  ];
  const missing = wanted.filter(([name]) => !read(name)).map(([name]) => name);
  if (missing.length) {
    console.error(`Missing in ${ENV_FILE}: ${missing.join(", ")}\nNothing was changed on Vercel.`);
    process.exit(1);
  }
  if (read("DODO_PAYMENTS_ENVIRONMENT") !== "live_mode" || read("NEXT_PUBLIC_DODO_TEST_MODE") !== "false") {
    console.error(`${ENV_FILE} must have DODO_PAYMENTS_ENVIRONMENT=live_mode and NEXT_PUBLIC_DODO_TEST_MODE=false.\nNothing was changed on Vercel.`);
    process.exit(1);
  }
  for (const [name, sensitive] of wanted) vars.push([name, read(name), sensitive]);
} else {
  for (const name of ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY", "RESEND_API_KEY"]) {
    const value = read(name);
    if (value) vars.push([name, value, true]);
    else console.log(`- ${name} is empty in ${ENV_FILE}, skipped`);
  }
  if (existsSync(SERVICE_ACCOUNT)) {
    vars.push(["FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(JSON.parse(readFileSync(SERVICE_ACCOUNT, "utf-8"))), true]); // one line
  } else {
    console.log(`- ${SERVICE_ACCOUNT} not found, FIREBASE_SERVICE_ACCOUNT_JSON skipped`);
  }
}

let failed = false;
for (const [name, value, sensitive] of vars) {
  const args = ["-y", "vercel@latest", "env", "add", name, "production", ...(sensitive ? ["--sensitive"] : []), "--force", "-y"];
  const res = spawnSync("npx", args, { input: value, encoding: "utf-8", shell: process.platform === "win32" });
  const ok = res.status === 0;
  failed ||= !ok;
  console.log(ok ? `✓ ${name} saved to Vercel (Production)` : `✗ ${name} failed:\n${res.stderr || res.stdout}`);
}
console.log(failed ? "\nSomething failed — send the message above to Claude." : "\nDone. Tell Claude: deploy");
process.exit(failed ? 1 : 0);
