import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_NOTIFICATION_EMAIL } from "@/data/config";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;
/** Same email submitting again inside this window is treated as a duplicate/spam resubmit, not a new inquiry. */
const RESUBMIT_THROTTLE_MS = 60_000;

/**
 * Public sponsor-interest form submits here (not via a direct table insert)
 * because sending the FTK notification email needs the server-only
 * RESEND_API_KEY. The insert always succeeds independent of whether the
 * email send does — a failed notification should never lose the inquiry.
 *
 * This is the one endpoint in the app any anonymous visitor can POST to, so
 * it gets its own abuse guards: field-length caps against oversized
 * payloads, and a short same-email throttle against a script hammering
 * "submit" (and spamming FTK's inbox / burning Resend send quota).
 */
export async function POST(request: NextRequest) {
  let body: {
    businessName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    message?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const businessName = body.businessName?.trim();
  const contactName = body.contactName?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  const message = body.message?.trim() ?? "";
  if (!businessName || !contactName || !email || !phone) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }
  if (
    businessName.length > MAX_FIELD_LENGTH ||
    contactName.length > MAX_FIELD_LENGTH ||
    email.length > MAX_FIELD_LENGTH ||
    phone.length > MAX_FIELD_LENGTH ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return NextResponse.json({ error: "One or more fields is too long." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: recent, error: recentError } = await admin
    .from("sponsor_inquiries")
    .select("submitted_at")
    .eq("email", email)
    .gte("submitted_at", new Date(Date.now() - RESUBMIT_THROTTLE_MS).toISOString())
    .limit(1)
    .maybeSingle();
  if (recentError) {
    console.error("sponsor-inquiries: throttle check failed", recentError.message);
  } else if (recent) {
    // Treat as a successful resubmit, not an error — the first submission
    // already went through and is being handled.
    return NextResponse.json({ ok: true, emailSent: true });
  }

  const { data: inserted, error: insertError } = await admin
    .from("sponsor_inquiries")
    .insert({
      business_name: businessName,
      contact_name: contactName,
      email,
      phone,
      message,
    })
    .select()
    .single();

  if (insertError) {
    console.error("sponsor-inquiries: insert failed", insertError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const submittedAt = new Date(inserted.submitted_at as string);
  const fields: [string, string][] = [
    ["Business Name", businessName],
    ["Contact Name", contactName],
    ["Email", email],
    ["Phone", phone],
    ["Message", message || "(none)"],
    ["Date Submitted", submittedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
  ];

  const html = `
    <h2>New Sponsor Inquiry</h2>
    <table cellpadding="6" cellspacing="0" border="0">
      ${fields
        .map(
          ([label, value]) =>
            `<tr><td style="color:#64748b;font-weight:600;white-space:nowrap;">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
        )
        .join("")}
    </table>
  `.trim();

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("Sponsor inquiry email not sent: RESEND_API_KEY is not configured.");
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
        subject: "New Sponsor Inquiry - FTK Athletics",
        html,
      }),
    });

    if (!emailRes.ok) {
      console.error("Sponsor inquiry email failed:", await emailRes.text());
      return NextResponse.json({ ok: true, emailSent: false });
    }

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Sponsor inquiry email failed:", err);
    return NextResponse.json({ ok: true, emailSent: false });
  }
}
