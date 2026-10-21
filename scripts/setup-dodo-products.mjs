// Creates one Dodo Payments product per Premium plan and writes the ids into
// .env.local (DODO_PRODUCT_1W, DODO_PRODUCT_3M). Safe to run again: plans
// that already have a matching product (same plan + price) are reused.
//
//   npm run dodo:setup        test mode, uses and updates .env.local
//   npm run dodo:setup:live   live mode, uses and updates .env.live.local
//
// Needs DODO_PAYMENTS_API_KEY in that file (a test key in .env.local, a live
// key in .env.live.local). Plans and prices come from src/lib/data/plans.ts.
import { readFileSync, writeFileSync } from "node:fs";
import DodoPayments from "dodopayments";

const environment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
// Live keys live in their own file so local development keeps using test mode.
const ENV_FILE = environment === "live_mode" ? ".env.live.local" : ".env.local";

if (!process.env.DODO_PAYMENTS_API_KEY) {
  console.error(`DODO_PAYMENTS_API_KEY is empty in ${ENV_FILE}.\nCreate a key in Dodo (Live Mode OFF) → Developer → API Keys, paste it into ${ENV_FILE}, then run this again.`);
  process.exit(1);
}

// { id: "1w", name: "Weekly", period: "week", count: 1, price: 1.99 ... }
const plans = [
  ...readFileSync("src/lib/data/plans.ts", "utf-8").matchAll(
    /\{\s*id:\s*"(\w+)",\s*name:\s*"([^"]+)",\s*period:\s*"(week|month)",\s*count:\s*(\d+),\s*price:\s*([\d.]+)/g,
  ),
].map(([, id, name, period, count, price]) => ({ id, name, period, count: Number(count), cents: Math.round(Number(price) * 100) }));
if (plans.length === 0) {
  console.error("Couldn't read the plans from src/lib/data/plans.ts.");
  process.exit(1);
}

const client = new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY, environment });

const existing = [];
try {
  for await (const p of client.products.list({ recurring: false })) existing.push(p);
} catch (err) {
  if (err?.status === 401) {
    console.error(`Dodo rejected the API key (401). Check it was created with Live Mode ${environment === "test_mode" ? "OFF" : "ON"} and copied in full.`);
  } else {
    console.error("Couldn't list Dodo products:", err?.message ?? err);
  }
  process.exit(1);
}

const ids = {};
for (const plan of plans) {
  const match = existing.find((p) => p.metadata?.irewin_plan === plan.id && p.price === plan.cents && p.currency === "EUR");
  if (match) {
    ids[plan.id] = match.product_id;
    console.log(`✓ ${plan.name}: using existing product ${match.product_id}`);
    continue;
  }
  const product = await client.products.create({
    name: `IREWIN Premium · ${plan.name}`,
    description: `${plan.count} ${plan.period}${plan.count > 1 ? "s" : ""} of IREWIN Premium: every job and direct apply links.`,
    price: { type: "one_time_price", currency: "EUR", price: plan.cents, discount: 0, purchasing_power_parity: false, tax_inclusive: true },
    tax_category: "saas",
    metadata: { irewin_plan: plan.id },
  });
  ids[plan.id] = product.product_id;
  console.log(`+ ${plan.name}: created product ${product.product_id} (€${(plan.cents / 100).toFixed(2)})`);
}

// Write DODO_PRODUCT_<PLAN>=<id> into .env.local, replacing existing lines or appending.
let env = readFileSync(ENV_FILE, "utf-8");
for (const [planId, productId] of Object.entries(ids)) {
  const key = `DODO_PRODUCT_${planId.toUpperCase()}`;
  const line = `${key}=${productId}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  env = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
}
writeFileSync(ENV_FILE, env);
console.log(`\nSaved ${Object.keys(ids).length} product ids to ${ENV_FILE} (${environment}). Restart \`npm run dev\` to pick them up.`);
