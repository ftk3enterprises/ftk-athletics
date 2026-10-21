import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProgramBySlug, programs } from "@/data/programs";
import { ADMIN_NOTIFICATION_EMAIL } from "@/data/config";
import type { CancellationResolution } from "@/types";

function getProgramById(programId: string) {
  return programs.find((p) => p.id === programId) ?? getProgramBySlug(programId);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Parents submit a cancellation request here (not via a direct table
 * insert) because sending the FTK notification email needs the server-only
 * RESEND_API_KEY. The registration itself is never modified — this only
 * ever creates a row for FTK to review and handle manually.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: {
    registrationId?: string;
    preferredResolution?: CancellationResolution;
    reason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { registrationId, preferredResolution, reason } = body;
  if (
    !registrationId ||
    (preferredResolution !== "credit" && preferredResolution !== "refund") ||
    !reason?.trim()
  ) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id, parent_name, email, phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (familyError) {
    console.error("cancellation-requests: family lookup failed", familyError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!family) {
    return NextResponse.json({ error: "Family profile not found." }, { status: 404 });
  }

  const { data: registration, error: registrationError } = await supabase
    .from("registrations")
    .select("*")
    .eq("id", registrationId)
    .eq("family_id", family.id)
    .maybeSingle();
  if (registrationError) {
    console.error("cancellation-requests: registration lookup failed", registrationError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!registration) {
    return NextResponse.json({ error: "Registration not found." }, { status: 404 });
  }

  const { data: insertedRequest, error: insertError } = await supabase
    .from("cancellation_requests")
    .insert({
      registration_id: registrationId,
      family_id: family.id,
      preferred_resolution: preferredResolution,
      reason: reason.trim(),
    })
    .select()
    .single();

  if (insertError) {
    // 23505 = unique_violation — a request for this registration already exists.
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Already requested." }, { status: 409 });
    }
    console.error("cancellation-requests: insert failed", insertError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const program = getProgramById(registration.program_id as string);
  const submittedAt = new Date(insertedRequest.created_at as string);

  const fields: [string, string][] = [
    ["Parent/Guardian Name", family.parent_name as string],
    ["Parent Email", family.email as string],
    ["Parent Phone", family.phone as string],
    ["Child's Name", registration.participant_name as string],
    ["Program", program?.name ?? (registration.program_id as string)],
    [
      "Selected Session/Dates",
      [registration.session_label, registration.session_date_range].filter(Boolean).join(" · "),
    ],
    ["Registration ID", registration.id as string],
    ["Original Amount", `$${Number(registration.price).toFixed(2)}`],
    ["Preferred Resolution", preferredResolution === "credit" ? "Credit Toward Future Program" : "Refund"],
    ["Reason For Cancellation", reason.trim()],
    ["Date Submitted", submittedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
  ];

  const html = `
    <h2>New Cancellation Request</h2>
    <table cellpadding="6" cellspacing="0" border="0">
      ${fields
        .map(
          ([label, value]) =>
            `<tr><td style="color:#64748b;font-weight:600;white-space:nowrap;">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
        )
        .join("")}
    </table>
  `.trim();

  const admin = createAdminClient();

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    await admin
      .from("cancellation_requests")
      .update({ email_sent: false, email_error: "RESEND_API_KEY is not configured." })
      .eq("id", insertedRequest.id);
    return NextResponse.json({ ok: true, emailSent: false });
  }

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "FTK Athletics <onboarding@resend.dev>",
        to: [ADMIN_NOTIFICATION_EMAIL],
        subject: "New Cancellation Request - FTK Athletics",
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      await admin
        .from("cancellation_requests")
        .update({ email_sent: false, email_error: errBody.slice(0, 500) })
        .eq("id", insertedRequest.id);
      return NextResponse.json({ ok: true, emailSent: false });
    }

    await admin
      .from("cancellation_requests")
      .update({ email_sent: true, email_error: null })
      .eq("id", insertedRequest.id);
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (err) {
    await admin
      .from("cancellation_requests")
      .update({
        email_sent: false,
        email_error: err instanceof Error ? err.message.slice(0, 500) : "Unknown error",
      })
      .eq("id", insertedRequest.id);
    return NextResponse.json({ ok: true, emailSent: false });
  }
}
