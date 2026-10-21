import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { programs } from "@/data/programs";
import { calculateSessionPrice, resolveSelectedWeeks } from "@/lib/pricing";
import { formatSelectedDatesLabel, formatSelectedWeeksLabel } from "@/lib/schedule-dates";
import type { ProgramWeek, Registration } from "@/types";

/** Generous but bounded — a real family registering many kids for many programs in one pass is normal; an unbounded array is not. */
const MAX_LINES_PER_REQUEST = 50;

interface LineInput {
  participantId?: string;
  programId?: string;
  sessionId?: string;
  schoolLocation?: string | null;
  dates?: string[];
  weekIds?: string[];
}

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
 * Creates one or more registrations for the signed-in family. Price is
 * ALWAYS computed here from the centralized pricing config
 * (src/lib/pricing.ts) and the server's own copy of src/data/programs.ts —
 * the client never sends a price, and anything it did send would be
 * ignored.
 *
 * The actual insert runs through the service-role client (never the user's
 * own session client) — `registrations` has no client-write privilege at
 * all as of migration 0006, so this route is the only place a registration
 * row can be created. Every value written is either server-computed or
 * checked against this family's own data first; nothing from the request
 * body is trusted as-is except the ids used to look things up.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { lines?: LineInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const lines = body.lines;
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "No registrations to create." }, { status: 400 });
  }
  if (lines.length > MAX_LINES_PER_REQUEST) {
    return NextResponse.json({ error: "Too many registrations in one request." }, { status: 400 });
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("id, waiver_accepted, waiver_accepted_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (familyError) {
    console.error("registrations: family lookup failed", familyError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  if (!family) return NextResponse.json({ error: "Family profile not found." }, { status: 404 });
  if (!family.waiver_accepted) {
    return NextResponse.json({ error: "Waiver must be signed before registering." }, { status: 400 });
  }

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, first_name, last_name")
    .eq("family_id", family.id);
  if (childrenError) {
    console.error("registrations: children lookup failed", childrenError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  const childById = new Map((children ?? []).map((c) => [c.id as string, c]));

  const userName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    "";

  // Service-role client for the actual write — see module comment. Also
  // used here to check for existing registrations, so the duplicate check
  // below sees the true state regardless of RLS.
  const admin = createAdminClient();

  const { data: existingRegistrations, error: existingError } = await admin
    .from("registrations")
    .select("participant_id, program_id, session_id")
    .eq("family_id", family.id)
    .neq("status", "cancelled");
  if (existingError) {
    console.error("registrations: existing-registration lookup failed", existingError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
  const existingKeys = new Set(
    (existingRegistrations ?? []).map((r) => `${r.participant_id}:${r.program_id}:${r.session_id}`)
  );

  const rows: {
    family_id: string;
    program_id: string;
    participant_id: string;
    participant_name: string;
    session_id: string;
    session_label: string;
    session_date_range: string | null;
    price: number;
    school_location: string | null;
    waiver_accepted_at: string | null;
    rate_type: "daily" | "weekly" | null;
    selected_dates: string[] | null;
    selected_weeks: ProgramWeek[] | null;
  }[] = [];
  const seenInThisRequest = new Set<string>();

  for (const line of lines) {
    const { participantId, programId, sessionId } = line;
    if (!participantId || !programId || !sessionId) {
      return NextResponse.json({ error: "Missing fields on a registration line." }, { status: 400 });
    }

    let participantName: string;
    if (participantId === user.id) {
      participantName = userName;
    } else {
      const child = childById.get(participantId);
      if (!child) {
        return NextResponse.json({ error: "Participant not found on this family." }, { status: 403 });
      }
      participantName = `${child.first_name} ${child.last_name}`;
    }

    const program = programs.find((p) => p.id === programId);
    const session = program?.sessions.find((s) => s.id === sessionId);
    if (!program || !session) {
      return NextResponse.json({ error: "Program or session not found." }, { status: 400 });
    }
    if (!program.registrationOpen || !session.registrationOpen) {
      return NextResponse.json(
        { error: `${program.name} isn't open for registration yet.` },
        { status: 409 }
      );
    }
    // School-based sessions (After School Program) are only real once a
    // school's 4-week block has exactly four confirmed class dates — this
    // mirrors the client-side filtering in AfterSchoolScheduleBlock, but is
    // enforced here too since stale/tampered client state must never be
    // able to buy an unconfigured session.
    if (session.schoolId && (session.classDates?.length ?? 0) !== 4) {
      return NextResponse.json(
        { error: `${program.name} doesn't have a confirmed session for that school yet.` },
        { status: 409 }
      );
    }

    const dupeKey = `${participantId}:${programId}:${sessionId}`;
    if (existingKeys.has(dupeKey) || seenInThisRequest.has(dupeKey)) {
      return NextResponse.json(
        { error: `${participantName} is already registered for ${program.name} — ${session.label}.` },
        { status: 409 }
      );
    }
    seenInThisRequest.add(dupeKey);

    let sessionDateRange = session.dateRange;
    let price: number;
    let rateType: "daily" | "weekly" | null = null;
    let selectedDates: string[] | null = null;
    let selectedWeeks: ProgramWeek[] | null = null;

    if (session.dateSelection) {
      rateType = session.dateSelection.type;
      if (session.dateSelection.type === "daily") {
        const available = session.dateSelection.availableDates ?? [];
        selectedDates = (line.dates ?? []).filter((d) => available.includes(d)).sort();
        price = calculateSessionPrice(session, { dates: selectedDates });
        sessionDateRange = formatSelectedDatesLabel(selectedDates);
      } else {
        selectedWeeks = resolveSelectedWeeks(session, line.weekIds);
        price = calculateSessionPrice(session, { weekIds: selectedWeeks.map((w) => w.id) });
        sessionDateRange = formatSelectedWeeksLabel(selectedWeeks);
      }
      if (price <= 0) {
        return NextResponse.json(
          { error: `Select at least one day or week for ${program.name}.` },
          { status: 400 }
        );
      }
    } else {
      price = calculateSessionPrice(session, undefined);
    }

    rows.push({
      family_id: family.id,
      program_id: program.id,
      participant_id: participantId,
      participant_name: participantName,
      session_id: session.id,
      session_label: session.label,
      session_date_range: sessionDateRange,
      price,
      school_location: program.requiresSchoolSelection ? (line.schoolLocation ?? null) : null,
      waiver_accepted_at: family.waiver_accepted_at,
      rate_type: rateType,
      selected_dates: selectedDates,
      selected_weeks: selectedWeeks,
    });
  }

  const { data: inserted, error: insertError } = await admin
    .from("registrations")
    .insert(rows)
    .select();
  if (insertError) {
    console.error("registrations: insert failed", insertError);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    registrations: (inserted as RegistrationRow[]).map(toRegistration),
  });
}
