import type { Waiver, WaiverAcceptance } from "@/types";
import { LIABILITY_WAIVER_VERSION } from "@/data/config";
import { createClient } from "@/lib/supabase/client";

/**
 * The liability waiver is accepted once per family account, not once per
 * registration — `families.waiver_*` columns are the fast "already signed?"
 * check. Every signing event is also appended to waiver_acceptances with the
 * exact participants/programs it covered and the typed signature, so the
 * full audit trail is kept, not just a boolean.
 */

interface WaiverAcceptanceRow {
  id: string;
  family_id: string;
  user_id: string;
  participant_ids: string[];
  program_ids: string[];
  version: string;
  signature_name: string;
  accepted_at: string;
}

function toWaiverAcceptance(row: WaiverAcceptanceRow): WaiverAcceptance {
  return {
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    participantIds: row.participant_ids,
    programIds: row.program_ids,
    version: row.version,
    signatureName: row.signature_name,
    acceptedAt: row.accepted_at,
  };
}

export async function getWaiverStatus(familyId: string): Promise<Waiver | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("families")
    .select("id, waiver_accepted, waiver_accepted_at, waiver_version, waiver_withdrawn_at")
    .eq("id", familyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    familyId: data.id,
    accepted: data.waiver_accepted,
    acceptedAt: data.waiver_accepted_at,
    version: data.waiver_version ?? LIABILITY_WAIVER_VERSION,
    withdrawnAt: data.waiver_withdrawn_at,
  };
}

export async function acceptWaiver(input: {
  familyId: string;
  userId: string;
  participantIds: string[];
  programIds: string[];
  signatureName: string;
}): Promise<{ waiver: Waiver; acceptance: WaiverAcceptance }> {
  const res = await fetch("/api/waiver/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      participantIds: input.participantIds,
      programIds: input.programIds,
      signatureName: input.signatureName,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong signing the waiver.");
  }
  const body = await res.json();
  return {
    waiver: body.waiver as Waiver,
    acceptance: toWaiverAcceptance(body.acceptance as WaiverAcceptanceRow),
  };
}

export async function listWaiverAcceptances(familyId: string): Promise<WaiverAcceptance[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("waiver_acceptances")
    .select()
    .eq("family_id", familyId)
    .order("accepted_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as WaiverAcceptanceRow[]).map(toWaiverAcceptance);
}
