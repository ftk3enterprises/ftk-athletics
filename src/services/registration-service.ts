import type { ProgramWeek, Registration } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface RegistrationRow {
  id: string;
  family_id: string;
  program_id: string;
  participant_id: string;
  participant_name: string;
  session_id: string;
  session_label: string;
  session_date_range: string | null;
  status: Registration["status"];
  price: number;
  school_location: string | null;
  waiver_accepted_at: string | null;
  payment_id: string | null;
  payment_method: Registration["paymentMethod"];
  created_at: string;
  rate_type: Registration["rateType"];
  selected_dates: string[] | null;
  selected_weeks: ProgramWeek[] | null;
}

function toRegistration(row: RegistrationRow): Registration {
  return {
    id: row.id,
    familyId: row.family_id,
    programId: row.program_id,
    participantId: row.participant_id,
    participantName: row.participant_name,
    sessionId: row.session_id,
    sessionLabel: row.session_label,
    sessionDateRange: row.session_date_range,
    status: row.status,
    price: Number(row.price),
    schoolLocation: row.school_location,
    waiverAcceptedAt: row.waiver_accepted_at,
    paymentId: row.payment_id,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    rateType: row.rate_type ?? null,
    selectedDates: row.selected_dates ?? null,
    selectedWeeks: row.selected_weeks ?? null,
  };
}

/**
 * Creates one or more registrations via /api/registrations, which recomputes
 * every price server-side from the centralized pricing config
 * (src/lib/pricing.ts) — this never sends a price, because the server would
 * ignore it anyway. Each line identifies a participant/program/session (plus
 * school location and date/week picks where applicable); the server resolves
 * participant name, session label, price, and waiver timestamp itself.
 */
export async function createRegistrations(
  lines: {
    participantId: string;
    programId: string;
    sessionId: string;
    schoolLocation?: string | null;
    dates?: string[];
    weekIds?: string[];
  }[]
): Promise<Registration[]> {
  const res = await fetch("/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong creating your registrations.");
  }
  const body = await res.json();
  return (body.registrations as RegistrationRow[]).map(toRegistration);
}

export async function getRegistration(id: string): Promise<Registration | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRegistration(data as RegistrationRow) : null;
}

export async function listRegistrationsByFamily(familyId: string): Promise<Registration[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select()
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as RegistrationRow[]).map(toRegistration);
}

/**
 * Records the family's choice to pay via Step Up For Students. This never
 * creates a Payment record or changes `status` — Step Up funding is handled
 * entirely outside this app, so there is no "approved"/"paid" state to track
 * here yet.
 */
export async function setRegistrationPaymentMethod(
  id: string,
  paymentMethod: Registration["paymentMethod"]
): Promise<Registration> {
  const res = await fetch("/api/registrations/payment-method", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ registrationId: id, paymentMethod }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong updating your payment method.");
  }
  const body = await res.json();
  return toRegistration(body.registration as RegistrationRow);
}
