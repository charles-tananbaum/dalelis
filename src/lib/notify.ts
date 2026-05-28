/**
 * Notification helpers for business-owner alerts.
 *
 * Each exported function attempts to deliver an HTML email (via Resend) and
 * an SMS (via Twilio) to the owner in parallel. Both channels are
 * independently optional: email is skipped silently if RESEND_API_KEY is
 * unset, SMS is skipped silently if TWILIO_ACCOUNT_SID is unset. Failures are
 * logged but never re-thrown — alert delivery must not cause a Stripe webhook
 * to return non-200.
 *
 * Configuration:
 *   - Resend: verify the sending domain at resend.com/domains. FROM_EMAIL
 *     (env var) must match a verified address; defaults to the production
 *     dalelismechanical.com identity.
 *   - Twilio: TWILIO_FROM_NUMBER must be a purchased/verified Twilio number.
 */

import { Resend } from 'resend';
import twilio from 'twilio';

const FROM_EMAIL =
  (import.meta.env.FROM_EMAIL as string | undefined) ??
  'Dalelis Mechanical <noreply@dalelismechanical.com>';

function getResend(): Resend {
  return new Resend(import.meta.env.RESEND_API_KEY as string);
}

function getTwilio(): ReturnType<typeof twilio> {
  return twilio(
    import.meta.env.TWILIO_ACCOUNT_SID as string,
    import.meta.env.TWILIO_AUTH_TOKEN as string,
  );
}

export interface SignupCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  billing: string;
  amount: string;
}

export interface CancellationCustomer {
  name: string;
  email: string;
  plan: string;
}

/**
 * Sends a new-signup alert to the business owner via email and SMS.
 * Called from the Stripe webhook on checkout.session.completed.
 * Never throws — errors are logged only.
 */
export async function notifySignup(customer: SignupCustomer): Promise<void> {
  const subject = `✅ New Membership: ${customer.name} — ${customer.plan}`;
  const html = buildSignupHtml(customer);
  const sms =
    `✅ New plan signup!\n` +
    `${customer.name} · ${customer.plan} (${customer.billing})\n` +
    `$${customer.amount} · ${customer.phone}\n` +
    `${customer.address}`;

  await Promise.all([
    sendEmail(subject, html),
    sendSms(sms),
  ]);
}

/**
 * Sends a cancellation alert to the business owner via email and SMS.
 * Called from the Stripe webhook on customer.subscription.deleted.
 * Never throws — errors are logged only.
 */
export async function notifyCancellation(customer: CancellationCustomer): Promise<void> {
  const subject = `❌ Cancelled: ${customer.name} — ${customer.plan}`;
  const html = buildCancellationHtml(customer);
  const sms =
    `❌ Membership cancelled\n` +
    `${customer.name} · ${customer.plan}\n` +
    `${customer.email}`;

  await Promise.all([
    sendEmail(subject, html),
    sendSms(sms),
  ]);
}

async function sendEmail(subject: string, html: string): Promise<void> {
  // Email is optional — Stripe handles payment confirmation to the account holder.
  // Skip silently if RESEND_API_KEY is not configured.
  if (!import.meta.env.RESEND_API_KEY) {
    console.log('[notify] RESEND_API_KEY not set, skipping email:', subject);
    return;
  }
  try {
    const resend = getResend();
    const monitor = import.meta.env.MONITOR_EMAIL as string | undefined;
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: import.meta.env.OWNER_EMAIL as string,
      // BCC a monitoring address (e.g. FieldPass) for visibility on every alert.
      // Silently omitted when MONITOR_EMAIL is unset.
      ...(monitor ? { bcc: monitor } : {}),
      subject,
      html,
    });
    if (error) {
      console.error('[notify] Resend error:', error);
    }
  } catch (err) {
    console.error('[notify] Failed to send email:', err);
  }
}

async function sendSms(body: string): Promise<void> {
  // SMS is optional — owner also receives email alert. Skip silently if Twilio not configured.
  if (!import.meta.env.TWILIO_ACCOUNT_SID) {
    console.log('[notify] TWILIO_ACCOUNT_SID not set, skipping SMS');
    return;
  }
  try {
    const client = getTwilio();
    await client.messages.create({
      body,
      from: import.meta.env.TWILIO_FROM_NUMBER as string,
      to: import.meta.env.OWNER_PHONE as string,
    });
  } catch (err) {
    console.error('[notify] Failed to send SMS:', err);
  }
}

function buildSignupHtml(c: SignupCustomer): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a1a1a;padding:28px 36px;">
          <p style="margin:0;color:#c8a96e;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Dalelis Mechanical</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:600;">✅ New Membership Signup</h1>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;width:140px;">Customer</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;font-weight:600;">${esc(c.name)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;">${esc(c.email)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;">${esc(c.phone)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;">Address</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;">${esc(c.address)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;">Plan</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;font-weight:600;">${esc(c.plan)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;">Billing</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;">${esc(c.billing)}</td></tr>
            <tr><td style="padding:10px 0;color:#666;font-size:14px;">Amount</td>
                <td style="padding:10px 0;font-size:14px;font-weight:600;">$${esc(c.amount)}</td></tr>
          </table>
          <p style="margin:28px 0 0;font-size:13px;color:#999;">Call within one business day to schedule the first visit.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildCancellationHtml(c: CancellationCustomer): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a1a1a;padding:28px 36px;">
          <p style="margin:0;color:#c8a96e;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Dalelis Mechanical</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:600;">❌ Membership Cancelled</h1>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;width:140px;">Customer</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;font-weight:600;">${esc(c.name)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;color:#666;font-size:14px;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #e8e4dc;font-size:14px;">${esc(c.email)}</td></tr>
            <tr><td style="padding:10px 0;color:#666;font-size:14px;">Plan</td>
                <td style="padding:10px 0;font-size:14px;">${esc(c.plan)}</td></tr>
          </table>
          <p style="margin:28px 0 0;font-size:13px;color:#999;">The Stripe subscription has been cancelled. No further charges will occur.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Escapes user-supplied strings for safe inline HTML rendering. */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
