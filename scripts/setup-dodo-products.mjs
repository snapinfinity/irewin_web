// Creates the Dodo Payments product for each Premium plan and writes the ids
// into the env file:
//   recurring plans → subscription products  (DODO_SUBSCRIPTION_1D, DODO_SUBSCRIPTION_1W, DODO_SUBSCRIPTION_3M)
//                     Daily renews every day, Weekly every week, 3 Months every 3 months, until cancelled.
//   one-off plans   → one-time products      (DODO_PRODUCT_1H, DODO_PRODUCT_1D: the 1-hour and 1-day passes)
// Safe to run again: plans that already have a matching product (same plan,
// price and billing interval) are reused.
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
  console.error(`DODO_PAYMENTS_API_KEY is empty in ${ENV_FILE}.\nCreate a key in Dodo (Live Mode ${environment === "test_mode" ? "OFF" : "ON"}) → Developer → API Keys, paste it into ${ENV_FILE}, then run this again.`);
  process.exit(1);
}

// { id: "1w", name: "Weekly", period: "week", count: 1, price: 1.99 ... }
const plans = [
  ...readFileSync("src/lib/data/plans.ts", "utf-8").matchAll(
    /\{\s*id:\s*"(\w+)",\s*name:\s*"([^"]+)",\s*period:\s*"(hour|day|week|month)",\s*count:\s*(\d+),\s*price:\s*([\d.]+),\s*recurring:\s*(true|false)/g,
  ),
].map(([, id, name, period, count, price, recurring]) => ({
  id,
  name,
  period,
  interval: period === "day" ? "Day" : period === "week" ? "Week" : "Month",
  count: Number(count),
  cents: Math.round(Number(price) * 100),
  recurring: recurring === "true",
}));
if (plans.length === 0) {
  console.error("Couldn't read the plans from src/lib/data/plans.ts.");
  process.exit(1);
}

const client = new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY, environment });

const existing = [];
try {
  for await (const p of client.products.list({ recurring: true })) existing.push(p);
  for await (const p of client.products.list({ recurring: false })) existing.push(p);
} catch (err) {
  if (err?.status === 401) {
    console.error(`Dodo rejected the API key (401). Check it was created with Live Mode ${environment === "test_mode" ? "OFF" : "ON"} and copied in full.`);
  } else {
    console.error("Couldn't list Dodo products:", err?.message ?? err);
  }
  process.exit(1);
}

const ids = {}; // env key → product id
for (const plan of plans) {
  const kind = plan.recurring ? "subscription" : "one_time";
  const envKey = `${plan.recurring ? "DODO_SUBSCRIPTION" : "DODO_PRODUCT"}_${plan.id.toUpperCase()}`;
  const match = existing.find(
    (p) =>
      p.metadata?.irewin_plan === plan.id &&
      p.metadata?.irewin_kind === kind &&
      p.price === plan.cents &&
      p.currency === "EUR",
  );
  if (match) {
    ids[envKey] = match.product_id;
    console.log(`✓ ${plan.name}: using existing ${kind} product ${match.product_id}`);
    continue;
  }
  if (!plan.recurring) {
    const length = `${plan.count} ${plan.period}${plan.count > 1 ? "s" : ""}`;
    const product = await client.products.create({
      name: `IREWIN Premium · ${plan.name}`,
      description: `${length} of IREWIN Premium: every job and direct apply links. One payment, no renewal.`,
      price: { type: "one_time_price", currency: "EUR", price: plan.cents, discount: 0, purchasing_power_parity: false, tax_inclusive: true },
      tax_category: "saas",
      metadata: { irewin_plan: plan.id, irewin_kind: kind },
    });
    ids[envKey] = product.product_id;
    console.log(`+ ${plan.name}: created one-time product ${product.product_id} (€${(plan.cents / 100).toFixed(2)} for ${length})`);
    continue;
  }
  const every = plan.count === 1 ? plan.period : `${plan.count} ${plan.period}s`;
  const product = await client.products.create({
    name: `IREWIN Premium · ${plan.name}`,
    description: `IREWIN Premium, renews every ${every}: every job and direct apply links. Cancel any time.`,
    price: {
      type: "recurring_price",
      currency: "EUR",
      price: plan.cents,
      discount: 0,
      purchasing_power_parity: false,
      tax_inclusive: true,
      payment_frequency_count: plan.count,
      payment_frequency_interval: plan.interval,
      // Long subscription period so it keeps renewing (if it equalled the billing interval it would end after one charge).
      subscription_period_count: 20,
      subscription_period_interval: "Year",
      trial_period_days: 0,
    },
    tax_category: "saas",
    metadata: { irewin_plan: plan.id, irewin_kind: "subscription" },
  });
  ids[envKey] = product.product_id;
  console.log(`+ ${plan.name}: created subscription product ${product.product_id} (€${(plan.cents / 100).toFixed(2)} every ${every})`);
}

// Write <KEY>=<id> into the env file, replacing existing lines or appending.
let env = readFileSync(ENV_FILE, "utf-8");
for (const [key, productId] of Object.entries(ids)) {
  const line = `${key}=${productId}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  env = re.test(env) ? env.replace(re, line) : `${env.trimEnd()}\n${line}\n`;
}
writeFileSync(ENV_FILE, env);
console.log(`\nSaved ${Object.keys(ids).length} product ids to ${ENV_FILE} (${environment}). Restart \`npm run dev\` to pick them up.`);
