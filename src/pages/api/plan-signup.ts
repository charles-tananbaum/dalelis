/**
 * POST /api/plan-signup
 *
 * Receives the maintenance plan intake form, then in order:
 *   1. Creates the customer in HousecallPro (TODO: real call — currently mocked)
 *   2. Sends an email to James notifying him of the new signup (TODO: real Resend call — currently mocked)
 *   3. Returns the Stripe Checkout URL for the selected plan + billing frequency
 *      (TODO: real Stripe API call — currently returns mock checkout URL)
 *
 * Replace the three TODO sections with real integrations once Dalelis has
 * Stripe + Resend keys configured.
 */

import type { APIRoute } from "astro";
import { getPlanBySlug, type BillingFrequency } from "~/lib/plans";

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

  // ── Build customer data ──
  const customerData = {
    plan: plan.slug,
    planName: plan.name,
    billing: billing as BillingFrequency,
    amount: billing === "annual" ? plan.annual : plan.monthly,
    name: name!.trim(),
    email: email!.trim(),
    phone: phone!.trim(),
    address: {
      street: street!.trim(),
      unit: unit.trim(),
      city: city!.trim(),
      state: state!.trim().toUpperCase(),
      zip: zip!.trim(),
    },
    notes: notes.trim(),
    paymentStatus: "pending" as const,
    submittedAt: new Date().toISOString(),
  };

  // ── 1. HousecallPro (MOCKED) ──
  // TODO: Replace with real HCP API call. Reference flow:
  //   1. POST /customers (or look up by email/phone) to upsert customer
  //   2. Add note + tag like `plan:heating` or `plan:whole-home`
  //   3. Mark payment_status:pending; webhook (or success URL) updates to paid
  console.log("[plan-signup] (MOCK) HCP customer upsert:", JSON.stringify(customerData, null, 2));

  // ── 2. Email to James (MOCKED) ──
  // TODO: Replace with real Resend / Postmark / SendGrid call.
  //   Subject: "🛠️ New Plan Signup — {planName} ({billing})"
  //   To: dalelismechanical@gmail.com
  //   Body: customer details, plan info, payment status (pending)
  console.log(
    `[plan-signup] (MOCK) Email to James:\n` +
      `  Subject: 🛠️ New ${plan.name} signup — ${customerData.name}\n` +
      `  Billing: ${billing} ($${customerData.amount})\n` +
      `  Customer: ${customerData.email} · ${customerData.phone}\n` +
      `  Address: ${customerData.address.street}, ${customerData.address.city} ${customerData.address.zip}`
  );

  // ── 3. Stripe Checkout (MOCKED) ──
  // TODO: Replace with real Stripe call:
  //   import Stripe from "stripe";
  //   const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);
  //   const session = await stripe.checkout.sessions.create({
  //     mode: billing === "monthly" ? "subscription" : "payment",
  //     line_items: [{ price: priceIdFor(plan, billing), quantity: 1 }],
  //     customer_email: email,
  //     success_url: `${origin}/maintenance-plans/thanks?session_id={CHECKOUT_SESSION_ID}`,
  //     cancel_url: `${origin}/maintenance-plans/sign-up/${plan.slug}/?billing=${billing}`,
  //     metadata: { plan: plan.slug, billing, hcp_customer_id: ... },
  //   });
  //   return jsonResponse({ success: true, checkoutUrl: session.url });
  const mockCheckoutUrl = `/maintenance-plans/checkout-mock?plan=${plan.slug}&billing=${billing}&amount=${customerData.amount}&name=${encodeURIComponent(customerData.name)}&email=${encodeURIComponent(customerData.email)}`;

  return jsonResponse({
    success: true,
    checkoutUrl: mockCheckoutUrl,
    plan: plan.slug,
    billing,
    amount: customerData.amount,
  });
};
