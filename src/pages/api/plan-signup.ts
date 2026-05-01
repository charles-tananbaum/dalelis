/**
 * POST /api/plan-signup
 *
 * Receives the maintenance plan intake form, validates it, then creates a
 * Stripe Checkout session and returns its URL. The browser redirects to
 * Stripe's hosted checkout from there.
 *
 * HousecallPro customer creation happens AFTER confirmed payment, in the
 * Stripe webhook handler (api/stripe-webhook.ts) — not here, because
 * payment is not yet confirmed at this point.
 *
 * On success:  { success: true,  checkoutUrl: string }
 * On error:    { success: false, error: string }  (status 400/422/500)
 */

import type { APIRoute } from "astro";
import { getPlanBySlug, type BillingFrequency } from "~/lib/plans";
import { stripe } from "~/lib/stripe";

export const prerender = false;

interface SignupPayload {
  plan?: string;
  billing?: string;
  name?: string;
  email?: string;
  phone?: string;
  street?: string;
  unit?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  return /^[\+]?[\d\s\-().]{7,15}$/.test(phone.trim());
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // ── Parse ──
  let payload: SignupPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const {
    plan: planSlug,
    billing,
    name,
    email,
    phone,
    street,
    unit = "",
    city,
    state,
    zip,
    notes = "",
  } = payload;

  // ── Validate ──
  const missing: string[] = [];
  if (!planSlug) missing.push("plan");
  if (!billing) missing.push("billing");
  if (!name?.trim()) missing.push("name");
  if (!email?.trim()) missing.push("email");
  if (!phone?.trim()) missing.push("phone");
  if (!street?.trim()) missing.push("street");
  if (!city?.trim()) missing.push("city");
  if (!state?.trim()) missing.push("state");
  if (!zip?.trim()) missing.push("zip");

  if (missing.length > 0) {
    return jsonResponse({ error: `Missing required fields: ${missing.join(", ")}` }, 422);
  }

  const plan = getPlanBySlug(planSlug!);
  if (!plan) {
    return jsonResponse({ error: "Invalid plan selected." }, 422);
  }

  if (billing !== "annual" && billing !== "monthly") {
    return jsonResponse({ error: "Invalid billing frequency." }, 422);
  }

  if (!isValidEmail(email!)) {
    return jsonResponse({ error: "Please enter a valid email address." }, 422);
  }

  if (!isValidPhone(phone!)) {
    return jsonResponse({ error: "Please enter a valid phone number." }, 422);
  }

  // ── Build shared data ──
  const billingFreq = billing as BillingFrequency;
  const amount = billingFreq === "annual" ? plan.annual : plan.monthly;
  const customerName = name!.trim();
  const customerEmail = email!.trim();
  const customerPhone = phone!.trim();
  const customerAddress = [
    street!.trim(),
    city!.trim(),
    state!.trim().toUpperCase(),
    zip!.trim(),
  ].join(", ");
  const customerApt = unit.trim();
  const customerNotes = notes.trim();
  const priceId = plan.stripePriceIds[billingFreq];
  const origin = new URL(request.url).origin;

  // ── Stripe Checkout session ──
  try {
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: billingFreq === "annual" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${origin}/maintenance-plans/thanks/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/maintenance-plans/sign-up/${plan.slug}/?billing=${billingFreq}`,
      phone_number_collection: { enabled: false },
      metadata: {
        plan_slug: plan.slug,
        plan_name: plan.name,
        billing: billingFreq,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        customer_apt: customerApt,
        customer_notes: customerNotes,
        amount_display: String(amount),
      },
    };

    // For one-time payments, explicitly request receipt delivery regardless of
    // the Dashboard "Successful payments" email toggle.
    if (billingFreq === "annual") {
      sessionParams.payment_intent_data = {
        receipt_email: customerEmail,
      };
    }

    // Subscriptions need metadata duplicated on the subscription object itself
    // so the customer.subscription.deleted webhook can read it without an
    // extra API call to retrieve the originating checkout session.
    if (billingFreq === "monthly") {
      sessionParams.subscription_data = {
        metadata: {
          plan_slug: plan.slug,
          plan_name: plan.name,
          billing: billingFreq,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          customer_apt: customerApt,
          customer_notes: customerNotes,
          amount_display: String(amount),
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return jsonResponse({
      success: true,
      checkoutUrl: session.url,
      plan: plan.slug,
      billing: billingFreq,
      amount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error.";
    console.error("[plan-signup] Stripe session creation failed:", err);
    return jsonResponse({ success: false, error: message }, 500);
  }
};
