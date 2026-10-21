import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records a family's choice to pay via Step Up For Students on one of their
 * own pending registrations. This is the only transition this route allows
 * — it never creates a Stripe Checkout Session, never marks the
 * registration paid, and is not a discount. `step_up` just means the
 * family intends to fund the registration through their official EMA
 * Step Up account; FTK still has to confirm the funds separately. Moving
 * to "online" (or any other value) isn't exposed here, since that's the
 * column's default and the only real "set" a client should ever trigger.
 *
 * `registrations` has no client-write privilege at all as of migration
 * 0006, so this route — using the service-role client, after verifying
 * ownership and status itself — is the only path that can flip this column.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { registrationId?: string; paymentMethod?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { registrationId, paymentMethod } = body;
  if (!registrationId || paymentMethod !== "step_up") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (familyError) {
    console.error("payment-method: family lookup failed", familyError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!family) return NextResponse.json({ error: "Family profile not found." }, { status: 404 });

  const admin = createAdminClient();

  const { data: registration, error: registrationError } = await admin
    .from("registrations")
    .select("id, family_id, status")
    .eq("id", registrationId)
    .maybeSingle();
  if (registrationError) {
    console.error("payment-method: registration lookup failed", registrationError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!registration || registration.family_id !== family.id) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }
  if (registration.status !== "pending_payment") {
    return NextResponse.json(
      { error: "This registration's payment method can no longer be changed." },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("registrations")
    .update({ payment_method: "step_up" })
    .eq("id", registrationId)
    .select()
    .single();
  if (updateError) {
    console.error("payment-method: update failed", updateError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ registration: updated });
}
