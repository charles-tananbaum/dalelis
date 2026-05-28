/**
 * Creates the Dalelis maintenance-plan products + prices in Stripe.
 *
 * Usage:
 *   Preview (no writes — see what it will create):
 *     STRIPE_SECRET_KEY=sk_live_… node scripts/create-stripe-products.mjs
 *   Apply (creates the products/prices):
 *     STRIPE_SECRET_KEY=sk_live_… node scripts/create-stripe-products.mjs --apply
 *
 * Run with the LIVE key to create live products. Idempotent: it searches for
 * existing products/prices by metadata and uses Stripe idempotency keys, so
 * re-running won't create duplicates.
 *
 * Annual  = one-time price  (checkout mode "payment" — no auto-renew).
 * Monthly = recurring price (checkout mode "subscription").
 * Amounts mirror src/lib/plans.ts.
 */

import Stripe from "stripe";

const PLANS = [
  { slug: "heating", name: "Heating Care", tagline: "Heating only", annual: 199, monthly: 19 },
  { slug: "heating-cooling", name: "Heating + Cooling", tagline: "Heating AND cooling", annual: 399, monthly: 37 },
  { slug: "whole-home", name: "Whole Home", tagline: "Heating, cooling + plumbing", annual: 549, monthly: 51 },
];

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("ERROR: STRIPE_SECRET_KEY is not set.");
  console.error("Run: STRIPE_SECRET_KEY=sk_live_… node scripts/create-stripe-products.mjs [--apply]");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const mode = key.startsWith("sk_live") ? "LIVE" : key.startsWith("sk_test") ? "TEST" : "UNKNOWN";
const stripe = new Stripe(key);

console.log(`\nStripe mode: ${mode}`);
console.log(apply ? "Action: APPLY — creating missing products/prices\n" : "Action: PREVIEW — no writes (re-run with --apply to create)\n");

async function findProduct(slug) {
  const res = await stripe.products.search({ query: `metadata['plan_slug']:'${slug}'`, limit: 1 });
  return res.data[0] ?? null;
}

async function findPrice(slug, billing) {
  const res = await stripe.prices.search({
    query: `metadata['plan_slug']:'${slug}' AND metadata['billing']:'${billing}'`,
    limit: 1,
  });
  return res.data[0] ?? null;
}

const results = [];

for (const plan of PLANS) {
  let product = await findProduct(plan.slug);
  if (product) {
    console.log(`= product ${plan.slug} exists: ${product.id}`);
  } else if (apply) {
    product = await stripe.products.create(
      {
        name: `${plan.name} — Maintenance Plan`,
        description: `Dalelis Mechanical maintenance plan (${plan.tagline}).`,
        metadata: { plan_slug: plan.slug },
      },
      { idempotencyKey: `dalelis_product_${plan.slug}` },
    );
    console.log(`✓ created product ${plan.slug}: ${product.id}`);
  } else {
    console.log(`• would create product ${plan.slug} (${plan.name})`);
  }

  const priceIds = { annual: "(pending --apply)", monthly: "(pending --apply)" };
  for (const billing of ["annual", "monthly"]) {
    const amount = plan[billing];
    let price = await findPrice(plan.slug, billing);
    if (price) {
      console.log(`  = ${billing} price exists: ${price.id}`);
    } else if (apply && product) {
      price = await stripe.prices.create(
        {
          product: product.id,
          currency: "usd",
          unit_amount: amount * 100,
          ...(billing === "monthly" ? { recurring: { interval: "month" } } : {}),
          nickname: `${plan.name} ${billing} ($${amount})`,
          metadata: { plan_slug: plan.slug, billing },
        },
        { idempotencyKey: `dalelis_price_${plan.slug}_${billing}` },
      );
      console.log(`  ✓ created ${billing} price $${amount}: ${price.id}`);
    } else {
      const kind = billing === "monthly" ? "recurring monthly" : "one-time";
      console.log(`  • would create ${billing} price $${amount} (${kind})`);
    }
    if (price) priceIds[billing] = price.id;
  }
  results.push({ slug: plan.slug, priceIds });
}

console.log("\n────────────────────────────────────────");
console.log("Price IDs for src/lib/plans.ts:\n");
for (const r of results) {
  console.log(`  ${r.slug}:`);
  console.log(`    annual:  "${r.priceIds.annual}",`);
  console.log(`    monthly: "${r.priceIds.monthly}",`);
}
console.log(apply ? "\nDone." : "\nPreview only — re-run with --apply to create.");
