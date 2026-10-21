import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIABILITY_WAIVER_VERSION } from "@/data/config";
import { programs } from "@/data/programs";

/**
 * Records a liability waiver signature. Previously this was a direct
 * client write to `families.waiver_accepted` — functionally no different
 * from a browser console being able to flip that flag on without ever
 * passing through this form. As of migration 0006, `families.waiver_*`
 * columns have no client-write privilege at all, so this route (via the
 * service-role client, after verifying ownership itself) is now the only
 * way that state can change. `waiver_acceptances` is still insert-only
 * directly from the client (append-only audit log, RLS-scoped to the
 * owning family) — this route just also appends there via the
 * service-role client so both writes happen together.
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
    participantIds?: string[];
    programIds?: string[];
    signatureName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { participantIds, programIds, signatureName } = body;
  if (
    !Array.isArray(participantIds) ||
    participantIds.length === 0 ||
    !Array.isArray(programIds) ||
    programIds.length === 0 ||
    typeof signatureName !== "string" ||
    signatureName.trim().length === 0
  ) {
    return NextResponse.json({ error: "Missing required waiver fields." }, { status: 400 });
  }
  if (!programIds.every((id) => programs.some((p) => p.id === id))) {
    return NextResponse.json({ error: "Unknown program." }, { status: 400 });
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (familyError) {
    console.error("waiver/accept: family lookup failed", familyError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!family) return NextResponse.json({ error: "Family profile not found." }, { status: 404 });

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id")
    .eq("family_id", family.id);
  if (childrenError) {
    console.error("waiver/accept: children lookup failed", childrenError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  const ownedParticipantIds = new Set([user.id, ...(children ?? []).map((c) => c.id as string)]);
  if (!participantIds.every((id) => ownedParticipantIds.has(id))) {
    return NextResponse.json({ error: "Participant not found on this family." }, { status: 403 });
  }

  const admin = createAdminClient();
  const acceptedAt = new Date().toISOString();

  const { data: acceptanceRow, error: acceptanceError } = await admin
    .from("waiver_acceptances")
    .insert({
      family_id: family.id,
      user_id: user.id,
      participant_ids: participantIds,
      program_ids: programIds,
      version: LIABILITY_WAIVER_VERSION,
      signature_name: signatureName.trim(),
      accepted_at: acceptedAt,
    })
    .select()
    .single();
  if (acceptanceError) {
    console.error("waiver/accept: acceptance insert failed", acceptanceError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const { error: familyUpdateError } = await admin
    .from("families")
    .update({
      waiver_accepted: true,
      waiver_accepted_at: acceptedAt,
      waiver_version: LIABILITY_WAIVER_VERSION,
      waiver_withdrawn_at: null,
    })
    .eq("id", family.id);
  if (familyUpdateError) {
    console.error("waiver/accept: family update failed", familyUpdateError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    waiver: {
      familyId: family.id,
      accepted: true,
      acceptedAt,
      version: LIABILITY_WAIVER_VERSION,
      withdrawnAt: null,
    },
    acceptance: acceptanceRow,
  });
}
