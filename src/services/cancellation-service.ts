import type { CancellationRequest, CancellationResolution } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface CancellationRequestRow {
  id: string;
  registration_id: string;
  family_id: string;
  preferred_resolution: CancellationResolution;
  reason: string;
  email_sent: boolean;
  email_error: string | null;
  created_at: string;
}

function toCancellationRequest(row: CancellationRequestRow): CancellationRequest {
  return {
    id: row.id,
    registrationId: row.registration_id,
    familyId: row.family_id,
    preferredResolution: row.preferred_resolution,
    reason: row.reason,
    emailSent: row.email_sent,
    emailError: row.email_error,
    createdAt: row.created_at,
  };
}

/** Used to know which registrations already show "Cancellation Requested". */
export async function listCancellationRequestsByFamily(
  familyId: string
): Promise<CancellationRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cancellation_requests")
    .select()
    .eq("family_id", familyId);
  if (error) throw new Error(error.message);
  return (data as CancellationRequestRow[]).map(toCancellationRequest);
}

/**
 * Submits a cancellation request. Goes through the API route (not a direct
 * table insert) because the server also sends the FTK notification email
 * with the Resend API key, which must never reach the browser.
 */
export async function submitCancellationRequest(input: {
  registrationId: string;
  preferredResolution: CancellationResolution;
  reason: string;
}): Promise<{ alreadyRequested: boolean }> {
  const res = await fetch("/api/cancellation-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (res.status === 409) return { alreadyRequested: true };
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }
  return { alreadyRequested: false };
}
