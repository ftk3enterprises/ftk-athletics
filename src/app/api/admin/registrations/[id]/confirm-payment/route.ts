import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-auth";

/**
 * Admin-only: manually confirms a payment that never goes through Stripe —
 * cash collected on-site, or Step Up scholarship funds FTK has verified
 * arrived. Mirrors exactly what the Stripe webhook does for a card payment
 * (src/app/api/webhooks/stripe) — flips the registration to "confirmed" —
 * except triggered manually by an admin rather than automatically by a
 * payment processor. Never creates a Payment record; neither method ever
 * gets one.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: registration, error: lookupError } = await admin
    .from("registrations")
    .select("id, payment_method, cash_collected_at, step_up_received_at")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) {
    console.error("confirm-payment: lookup failed", lookupError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  const patch: { status: "confirmed"; cash_collected_at?: string; step_up_received_at?: string } = {
    status: "confirmed",
  };
  if (registration.payment_method === "cash") {
    if (registration.cash_collected_at) return NextResponse.json({ ok: true });
    patch.cash_collected_at = new Date().toISOString();
  } else if (registration.payment_method === "step_up") {
    if (registration.step_up_received_at) return NextResponse.json({ ok: true });
    patch.step_up_received_at = new Date().toISOString();
  } else {
    return NextResponse.json(
      { error: "Only cash and Step Up payments can be manually confirmed." },
      { status: 409 }
    );
  }

  const { error: updateError } = await admin.from("registrations").update(patch).eq("id", id);
  if (updateError) {
    console.error("confirm-payment: update failed", updateError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
