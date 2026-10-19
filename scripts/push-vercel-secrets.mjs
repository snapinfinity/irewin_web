// Copies the server secrets to Vercel (Production, stored as Sensitive):
//   DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_WEBHOOK_KEY, RESEND_API_KEY  ← from .env.local (empty ones are skipped)
//   FIREBASE_SERVICE_ACCOUNT_JSON                                     ← from ../irewin_dashboard/service-account.json
//
//   node scripts/push-vercel-secrets.mjs
//
// Values are sent to the Vercel CLI on stdin, never printed or put on the command line.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const SERVICE_ACCOUNT = "../irewin_dashboard/service-account.json";
const FROM_ENV_LOCAL = ["DODO_PAYMENTS_API_KEY", "DODO_PAYMENTS_WEBHOOK_KEY", "RESEND_API_KEY"];

const envLocal = readFileSync(".env.local", "utf-8");
const secrets = [];
for (const name of FROM_ENV_LOCAL) {
  const value = envLocal.match(new RegExp(`^${name}=(.+)$`, "m"))?.[1]?.trim();
  if (value) secrets.push([name, value]);
  else console.log(`- ${name} is empty in .env.local, skipped`);
}
if (existsSync(SERVICE_ACCOUNT)) {
  secrets.push(["FIREBASE_SERVICE_ACCOUNT_JSON", JSON.stringify(JSON.parse(readFileSync(SERVICE_ACCOUNT, "utf-8")))]); // one line
} else {
  console.log(`- ${SERVICE_ACCOUNT} not found, FIREBASE_SERVICE_ACCOUNT_JSON skipped`);
}

let failed = false;
for (const [name, value] of secrets) {
  const res = spawnSync("npx", ["-y", "vercel@latest", "env", "add", name, "production", "--sensitive", "--force", "-y"], {
    input: value,
    encoding: "utf-8",
    shell: process.platform === "win32",
  });
  const ok = res.status === 0;
  failed ||= !ok;
  console.log(ok ? `✓ ${name} saved to Vercel (Production)` : `✗ ${name} failed:\n${res.stderr || res.stdout}`);
}
console.log(failed ? "\nSomething failed — send the message above to Claude." : "\nDone. Tell Claude: deploy");
process.exit(failed ? 1 : 0);
