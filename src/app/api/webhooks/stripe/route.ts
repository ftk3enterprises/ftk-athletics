import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe calls this directly (not the browser), so it can't go through the
 * normal cookie-based Supabase client — this uses the service-role admin
 * client instead. Signature verification (via STRIPE_WEBHOOK_SECRET) is
 * what proves a request actually came from Stripe; never trust this route
 * without it.
 */

/**
 * Marks a payment paid and confirms its registrations — the one place that
 * ever does so. Guarded three ways against the failure modes async/retried
 * webhooks create: `status !== "paid"` makes a duplicate delivery of the
 * same event a no-op; the amount/currency re-check means a session that
 * somehow doesn't match what we charged for never gets confirmed; and
 * because this only ever moves a payment TOWARD "paid", never away from
 * it, a late/out-of-order failure event (handled below) can't undo a
 * confirmation that already landed.
 */
async function confirmPayment(
  admin: ReturnType<typeof createAdminClient>,
  paymentId: string,
  session: Stripe.Checkout.Session
) {
  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id, status, amount, registration_ids")
    .eq("id", paymentId)
    .maybeSingle();
  if (paymentError) {
    console.error("stripe webhook: payment lookup failed", paymentError.message);
    return;
  }
  if (!payment || payment.status === "paid") return;

  const expectedCents = Math.round(Number(payment.amount) * 100);
  if (session.currency !== "usd" || session.amount_total !== expectedCents) {
    console.error(
      "stripe webhook: amount/currency mismatch, refusing to confirm",
      JSON.stringify({ paymentId, expectedCents, gotAmount: session.amount_total, gotCurrency: session.currency })
    );
    return;
  }

  const { error: updatePaymentError } = await admin
    .from("payments")
    .update({
      status: "paid",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    })
    .eq("id", paymentId)
    .eq("status", "pending");
  if (updatePaymentError) {
    console.error("stripe webhook: payment update failed", updatePaymentError.message);
    return;
  }

  const { error: updateRegistrationsError } = await admin
    .from("registrations")
    .update({ status: "confirmed", payment_id: paymentId })
    .in("id", payment.registration_ids);
  if (updateRegistrationsError) {
    console.error("stripe webhook: registration confirm failed", updateRegistrationsError.message);
  }
}

async function failPayment(admin: ReturnType<typeof createAdminClient>, paymentId: string) {
  // Scoped to status = 'pending' so a late/out-of-order failure event can
  // never revert a payment that another event already confirmed as paid.
  const { error } = await admin
    .from("payments")
    .update({ status: "failed" })
    .eq("id", paymentId)
    .eq("status", "pending");
  if (error) console.error("stripe webhook: fail-payment update failed", error.message);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // constructEventAsync (not constructEvent): Cloudflare Workers only
    // expose crypto via the async SubtleCrypto API, so the sync verifier
    // throws there. Async works identically on Node, so this is safe
    // regardless of host.
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    console.error("stripe webhook: signature verification failed", message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.client_reference_id ?? session.metadata?.paymentId;
      // "completed" fires as soon as checkout finishes, but for async
      // payment methods (e.g. bank debits) payment_status is still
      // "unpaid" at that point — the real outcome arrives later via
      // async_payment_succeeded/async_payment_failed. Only confirm here
      // when Stripe has actually reported the money as received.
      if (paymentId && session.payment_status === "paid") {
        await confirmPayment(admin, paymentId, session);
      }
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.client_reference_id ?? session.metadata?.paymentId;
      if (paymentId) await failPayment(admin, paymentId);
    }
  } catch (err) {
    // Never let an unexpected failure surface customer data to Stripe's
    // retry logs — log safely server-side and let Stripe retry the event.
    console.error("stripe webhook: unhandled error processing event", event.type, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Webhook processing error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
