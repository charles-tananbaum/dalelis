/**
 * Maintenance plan definitions — single source of truth.
 * Plan slugs are URL-safe and used in:
 *   - Plan card "Choose Plan" buttons → /maintenance-plans/sign-up/[slug]/
 *   - Intake form param
 *   - HCP customer tag (e.g. "plan:heating")
 *   - Stripe Payment Link mapping
 */

export const ADDITIONAL_UNIT_PRICE = 175;

export type BillingFrequency = "annual" | "monthly";

export interface Plan {
  slug: string;
  name: string;
  tagline: string;
  shortName: string;
  annual: number;
  monthly: number;
  popular: boolean;
  visits: string;
  includes: string[];
  /**
   * Stripe Price IDs, split by mode. The signup flow picks test vs live based
   * on the active STRIPE_SECRET_KEY (see `stripeMode` in lib/stripe.ts) — a
   * test key cannot use live price IDs and vice versa.
   * Annual → one-time payment Price; Monthly → recurring subscription Price.
   */
  stripePriceIds: {
    test: { annual: string; monthly: string };
    live: { annual: string; monthly: string };
  };
}

export const PLANS: Plan[] = [
  {
    slug: "heating",
    name: "Heating Care",
    shortName: "Heating",
    tagline: "Heating only",
    annual: 199,
    monthly: 19, // 10% premium → ~$219/yr equivalent, rounded
    popular: false,
    visits: "1 visit per year",
    includes: [
      "1 heating tune-up annually",
      "Full system inspection & cleaning",
      "Priority emergency scheduling",
      "10% off heating repairs",
      "No overtime or trip charges",
      "Satisfaction guarantee",
    ],
    stripePriceIds: {
      test: {
        annual: "price_1TRzzGC79j4Jzw3undpYow8L",
        monthly: "price_1TRzyHC79j4Jzw3uVmWzQOiI",
      },
      live: {
        annual: "price_1Tc53WKbnxwyKnckifwbIlnH",
        monthly: "price_1Tc53WKbnxwyKnckJiXdq3jv",
      },
    },
  },
  {
    slug: "heating-cooling",
    name: "Heating + Cooling",
    shortName: "Heating + Cooling",
    tagline: "Heating AND cooling",
    annual: 399,
    monthly: 37, // ~$444/yr equivalent
    popular: true,
    visits: "2 visits per year",
    includes: [
      "Spring AC tune-up",
      "Fall heating tune-up",
      "Full system inspection & cleaning",
      "Priority emergency scheduling",
      "10% off heating & cooling repairs",
      "No overtime or trip charges",
      "Satisfaction guarantee",
    ],
    stripePriceIds: {
      test: {
        annual: "price_1TRzzjC79j4Jzw3uJ74AEE1s",
        monthly: "price_1TS008C79j4Jzw3ui8mnBDTq",
      },
      live: {
        annual: "price_1Tc53XKbnxwyKnckCrMWwCK9",
        monthly: "price_1Tc53YKbnxwyKnckX4kJWxL6",
      },
    },
  },
  {
    slug: "whole-home",
    name: "Whole Home",
    shortName: "Whole Home",
    tagline: "Heating, cooling + plumbing",
    annual: 549,
    monthly: 51, // ~$612/yr equivalent
    popular: false,
    visits: "2 HVAC + 1 plumbing visit per year",
    includes: [
      "Spring AC + Fall heating tune-ups",
      "Annual plumbing inspection",
      "Water heater flush & inspection",
      "Fixture and valve check",
      "10% off heating, cooling & plumbing repairs",
      "Priority scheduling year-round",
      "No overtime or trip charges",
    ],
    stripePriceIds: {
      test: {
        annual: "price_1TS00YC79j4Jzw3uQ9qTtCva",
        monthly: "price_1TS00uC79j4Jzw3uTUaLLa0c",
      },
      live: {
        annual: "price_1Tc53ZKbnxwyKnckNnJs4bXh",
        monthly: "price_1Tc53ZKbnxwyKnckBtHKtq0S",
      },
    },
  },
];

export function getPlanBySlug(slug: string): Plan | undefined {
  return PLANS.find((p) => p.slug === slug);
}
