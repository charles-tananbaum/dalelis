import Stripe from 'stripe';

/**
 * Singleton Stripe client shared across all server-side API routes.
 * Uses the installed package's API version (2026-04-22.dahlia) rather
 * than the older version in the original instructions — they diverged
 * because stripe@22 shipped a new API revision.
 */
export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string, {
  // Non-null assertion not needed here — import.meta.env values are typed as `any`
  // via Vite's ImportMetaEnv index signature. A missing key produces a runtime
  // error from Stripe itself, which is the correct failure mode.
  apiVersion: '2026-04-22.dahlia',
});

/**
 * Which Stripe mode the active key targets. Price IDs are mode-specific
 * (a test key can't use live prices), so the signup flow selects the right
 * set from plans.ts based on this. Anything that isn't an sk_live key is
 * treated as test.
 */
export const stripeMode: 'test' | 'live' =
  (import.meta.env.STRIPE_SECRET_KEY as string | undefined)?.startsWith('sk_live')
    ? 'live'
    : 'test';
