/**
 * Submits through /api/sponsor-inquiries (not a direct table insert)
 * because sending the FTK notification email needs the server-only
 * RESEND_API_KEY.
 */
export async function submitSponsorInquiry(input: {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
}): Promise<void> {
  const res = await fetch("/api/sponsor-inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
}
