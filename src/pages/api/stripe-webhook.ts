/**
 * POST /api/stripe-webhook
 *
 * Receives and verifies Stripe webhook events. Always returns 200 after
 * signature verification — Stripe retries on non-200, so downstream errors
 * (HCP, notifications) are logged but must not propagate as HTTP errors.
 *
 * Events handled:
 *   checkout.session.completed — create HCP customer, notify owner of signup
 *   customer.subscription.deleted — notify owner of cancellation
 *
 * Configure in Stripe dashboard: Developers → Webhooks → Add endpoint
 *   URL: https://www.dalelismechanical.com/api/stripe-webhook
 *   Events: checkout.session.completed, customer.subscription.deleted
 */

import type { APIRoute } from "astro";
import type Stripe from "stripe";
import { stripe } from "~/lib/stripe";
import { createCustomer, addNoteToCustomer } from "~/lib/hcp";
import { notifySignup, notifyCancellation } from "~/lib/notify";

export const prerender = false;

function ok(): Response {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // Raw body required — Stripe signature verification breaks on parsed JSON.
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      import.meta.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // ── checkout.session.completed ──
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    const customerName = meta["customer_name"] ?? "";
    const planName = meta["plan_name"] ?? "";
    const planSlug = meta["plan_slug"] ?? "";
    const billing = meta["billing"] ?? "";
    const customerPhone = meta["customer_phone"] ?? "";
    const customerAddress = meta["customer_address"] ?? "";
    const customerApt = meta["customer_apt"] ?? "";
    const customerNotes = meta["customer_notes"] ?? "";
    const amountDisplay = meta["amount_display"] ?? "";

    // Split "First Last" → first_name / last_name; fall back gracefully.
    const spaceIdx = customerName.indexOf(" ");
    const firstName = spaceIdx !== -1 ? customerName.slice(0, spaceIdx) : customerName;
    const lastName = spaceIdx !== -1 ? customerName.slice(spaceIdx + 1) : "";

    // customer_address is "street, city, state, zip" — parse back out.
    const [addrStreet = "", addrCity = "", addrState = "", addrZip = ""] =
      customerAddress.split(", ");

    try {
      const hcpId = await createCustomer({
        first_name: firstName,
        last_name: lastName,
        email: session.customer_email ?? "",
        mobile_number: customerPhone,
        addresses: [
          {
            street: addrStreet,
            street_line_2: customerApt || undefined,
            city: addrCity,
            state: addrState,
            zip: addrZip,
            type: "service",
          },
        ],
        lead_source: "Website Membership",
        tags: [`plan:${planSlug}`, `billing:${billing}`],
        notifications_enabled: true,
      });

      const signedUpDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await addNoteToCustomer(
        hcpId,
        `Membership: ${planName} (${billing}). Signed up ${signedUpDate}. ` +
          `Amount: $${amountDisplay}. ` +
          (customerNotes ? `Customer notes: "${customerNotes}". ` : "") +
          `Via Stripe session ${session.id}.`,
      );

      console.log(
        `[stripe-webhook] HCP customer created: ${customerName} · ${planName} (${billing})`,
      );
    } catch (err) {
      console.error("[stripe-webhook] HCP customer creation failed:", err);
    }

    await notifySignup({
      name: customerName,
      email: session.customer_email ?? "",
      phone: customerPhone,
      address: customerAddress,
      plan: planName,
      billing,
      amount: amountDisplay,
    });

    return ok();
  }

  // ── customer.subscription.deleted ──
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const meta = subscription.metadata ?? {};

    const customerName = meta["customer_name"] ?? "Unknown";
    const planName = meta["plan_name"] ?? "Unknown plan";

    // Retrieve email from the Stripe Customer object (not stored in sub metadata).
    let customerEmail = "";
    try {
      const stripeCustomer = await stripe.customers.retrieve(
        subscription.customer as string,
      );
      // customers.retrieve can return a DeletedCustomer — check before accessing email.
      if (stripeCustomer.deleted !== true) {
        customerEmail = (stripeCustomer as Stripe.Customer).email ?? "";
      }
    } catch (err) {
      console.error("[stripe-webhook] Could not retrieve Stripe customer for cancellation:", err);
    }

    await notifyCancellation({ name: customerName, email: customerEmail, plan: planName });

    console.log(`[stripe-webhook] Subscription cancelled: ${customerName} · ${planName}`);

    return ok();
  }

  // Unhandled event types — still return 200 so Stripe doesn't retry.
  return ok();
};
