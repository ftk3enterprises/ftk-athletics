import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { getProgramBySlug, programs } from "@/data/programs";

function getProgramById(programId: string) {
  return programs.find((p) => p.id === programId) ?? getProgramBySlug(programId);
}

/**
 * Creates a Stripe Checkout Session. The amount is always the sum of
 * `registrations.price` for the given ids — set server-side at creation
 * time by /api/registrations — re-summed here from the database, never
 * taken from the client. A client that sends someone else's registration
 * id, an already-paid/cancelled id, or no ids at all is rejected.
 *
 * Flow: insert a `pending` payment row first so we have a stable internal
 * id, create the Checkout Session with that id as client_reference_id,
 * then stamp the session id onto the payment row. The webhook
 * (/api/webhooks/stripe) is what actually flips status to "paid" and
 * confirms the registrations once Stripe reports success — this route
 * never marks anything paid itself. `payments`/`registrations` have no
 * client-write privilege at all as of migration 0006, so every write here
 * goes through the service-role client.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { registrationIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const registrationIds = body.registrationIds;
  if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
    return NextResponse.json({ error: "No registrations to pay for." }, { status: 400 });
  }
  if (registrationIds.length > 50 || !registrationIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (familyError) {
    console.error("checkout: family lookup failed", familyError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!family) return NextResponse.json({ error: "Family profile not found." }, { status: 404 });

  const admin = createAdminClient();

  const { data: registrations, error: registrationsError } = await admin
    .from("registrations")
    .select("id, price, family_id, program_id, session_id, participant_name, session_label, status")
    .in("id", registrationIds);
  if (registrationsError) {
    console.error("checkout: registration lookup failed", registrationsError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (
    !registrations ||
    registrations.length !== registrationIds.length ||
    registrations.some((r) => r.family_id !== family.id)
  ) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }
  const notPayable = registrations.find((r) => r.status !== "pending_payment");
  if (notPayable) {
    return NextResponse.json(
      { error: "One or more of these registrations can no longer be paid for." },
      { status: 409 }
    );
  }

  // Re-validates against CURRENT program/session availability — not just
  // the fact that this registration row exists. A registration created
  // days or weeks ago (e.g. an abandoned Stripe Checkout being resumed)
  // must not be payable if the program or session has since closed, even
  // though its price/row are still perfectly valid historical data. This
  // never changes the stored price — only whether paying for it is allowed
  // right now.
  for (const r of registrations) {
    const program = getProgramById(r.program_id as string);
    const session = program?.sessions.find((s) => s.id === r.session_id);
    if (!program || !session || !program.registrationOpen || !session.registrationOpen) {
      return NextResponse.json(
        {
          error: `${program?.name ?? "This program"} is no longer open for registration. Please contact us about this registration.`,
        },
        { status: 409 }
      );
    }
  }

  // Idempotency guard: a double-click or page reload shouldn't open a second
  // Stripe Checkout Session (and risk a double charge) for the same
  // registrations while an earlier one is still awaiting payment — reuse it.
  // Must match the registration set EXACTLY. `.contains` alone only proves
  // the stored set is a superset of what was requested — e.g. an unpaid
  // $180 session originally covering two registrations would otherwise get
  // reused (and its full $180 charged) when the user asks to pay for just
  // one of them at $60. The `.contains` call below is kept as a cheap
  // index-assisted pre-filter; the actual reuse decision is the exact-size
  // match below it.
  const { data: reuseCandidates, error: reusableError } = await admin
    .from("payments")
    .select("id, stripe_session_id, registration_ids")
    .eq("status", "pending")
    .contains("registration_ids", registrationIds)
    .not("stripe_session_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (reusableError) {
    console.error("checkout: reusable-payment lookup failed", reusableError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  const requestedIdSet = new Set(registrationIds);
  const reusablePayment = reuseCandidates?.find(
    (p) =>
      p.registration_ids.length === registrationIds.length &&
      p.registration_ids.every((id: string) => requestedIdSet.has(id))
  );
  if (reusablePayment?.stripe_session_id) {
    const existingSession = await stripe.checkout.sessions.retrieve(reusablePayment.stripe_session_id);
    if (existingSession.status === "open" && existingSession.url) {
      return NextResponse.json({ paymentId: reusablePayment.id, url: existingSession.url });
    }
  }

  const amount = registrations.reduce((sum, r) => sum + Number(r.price), 0);

  const { data: paymentRow, error: insertError } = await admin
    .from("payments")
    .insert({
      registration_ids: registrationIds,
      amount,
      status: "pending",
      reference: `FTK-${Math.floor(100000 + Math.random() * 900000)}`,
    })
    .select()
    .single();
  if (insertError) {
    console.error("checkout: payment insert failed", insertError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: registrations.map((r) => ({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(r.price) * 100),
          product_data: {
            name: `${getProgramById(r.program_id as string)?.name ?? r.program_id} — ${r.participant_name}`,
            description: r.session_label as string,
          },
        },
        quantity: 1,
      })),
      client_reference_id: paymentRow.id,
      metadata: { paymentId: paymentRow.id, familyId: family.id },
      customer_email: user.email ?? undefined,
      success_url: `${origin}/register/confirmation?payment=${paymentRow.id}`,
      cancel_url: `${origin}/register/payment?canceled=1`,
    },
    // Ties this Stripe call to the specific payment row we just inserted —
    // if anything (a retry on our end, a flaky connection) causes this
    // exact request to fire twice, Stripe returns the original session
    // instead of creating a second one.
    { idempotencyKey: `checkout-session-${paymentRow.id}` }
  );

  const { error: updateError } = await admin
    .from("payments")
    .update({ stripe_session_id: session.id })
    .eq("id", paymentRow.id);
  if (updateError) {
    console.error("checkout: stamping stripe_session_id failed", updateError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
  }

  return NextResponse.json({ paymentId: paymentRow.id, url: session.url });
}
