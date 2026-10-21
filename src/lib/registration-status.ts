import type { Registration } from "@/types";

/**
 * The UI-facing lifecycle of a registration — distinct from the raw
 * `Registration.status`/`paymentMethod` columns, which only distinguish
 * pending_payment/confirmed/cancelled and online/step_up. This derives the
 * richer state a parent actually needs to see:
 *
 * - "awaiting_payment": the registration has been fully submitted (every
 *   persisted registration row has — there is no partial/incomplete row in
 *   this schema) but online payment hasn't succeeded yet, whether or not a
 *   Stripe Checkout session was ever started. Always resumable via the same
 *   "Complete Payment" action.
 * - "step_up_pending": family submitted intent to pay via Step Up For
 *   Students. Deliberately kept separate from "awaiting_payment" — there is
 *   no Stripe session involved and nothing to "complete" here in-app.
 * - "confirmed": Stripe has verified payment via the webhook. The only
 *   writer of this state is /api/webhooks/stripe — never the client.
 * - "cancelled": the registration was cancelled.
 *
 * Entirely derived from already-authoritative, server/webhook-written
 * columns (registrations.status, registrations.payment_method) — nothing
 * here is inferred from a browser redirect or client-cached value.
 */
export type RegistrationUiState =
  | "awaiting_payment"
  | "step_up_pending"
  | "confirmed"
  | "cancelled";

export function deriveRegistrationUiState(
  registration: Pick<Registration, "status" | "paymentMethod">
): RegistrationUiState {
  if (registration.status === "cancelled") return "cancelled";
  if (registration.status === "confirmed") return "confirmed";

  // status === "pending_payment" from here on.
  return registration.paymentMethod === "step_up" ? "step_up_pending" : "awaiting_payment";
}
