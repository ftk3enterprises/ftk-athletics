import type { Payment, PaymentStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface PaymentRow {
  id: string;
  registration_ids: string[];
  amount: number;
  status: PaymentStatus;
  reference: string;
  created_at: string;
}

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    registrationIds: row.registration_ids,
    amount: Number(row.amount),
    status: row.status,
    createdAt: row.created_at,
    reference: row.reference,
  };
}

/**
 * Creates a real Stripe Checkout Session via /api/checkout, which re-sums
 * `registrations.price` for these ids server-side — the amount charged
 * never comes from the client. Returns the hosted Checkout URL to redirect
 * the browser to; payment confirmation happens out-of-band via the
 * /api/webhooks/stripe handler once Stripe reports success, not here.
 */
export async function createCheckoutSession(input: {
  registrationIds: string[];
}): Promise<{ paymentId: string; url: string }> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ registrationIds: input.registrationIds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Payment failed. Please try again.");
  }
  return res.json();
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("status")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.status ?? null;
}

export async function getPayment(paymentId: string): Promise<Payment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select()
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toPayment(data as PaymentRow) : null;
}

/** Batched variant of getPayment for when several ids are needed at once (avoids N separate round-trips). */
export async function getPayments(paymentIds: string[]): Promise<Payment[]> {
  if (paymentIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from("payments").select().in("id", paymentIds);
  if (error) throw new Error(error.message);
  return (data as PaymentRow[]).map(toPayment);
}
