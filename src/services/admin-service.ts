import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProgramBySlug, programs } from "@/data/programs";
import type { CancellationResolution, PaymentStatus, RegistrationPaymentMethod } from "@/types";

export interface AdminRegistrationRow {
  registrationId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  participantName: string;
  childSchool: string | null;
  childGrade: string | null;
  programName: string;
  sessionLabel: string;
  sessionDateRange: string | null;
  /** School/location chosen at registration time for site-based programs (e.g. After School) — distinct from childSchool, the child's current school on their profile. */
  schoolLocation: string | null;
  rateType: "daily" | "weekly" | null;
  registeredAt: string;
  amount: number;
  paymentStatus: PaymentStatus | "pending";
  paymentMethod: RegistrationPaymentMethod;
  registrationStatus: string;
  cancellationRequested: boolean;
  cancellationReason: string | null;
  preferredResolution: CancellationResolution | null;
  cancellationRequestDate: string | null;
}

function getProgramById(programId: string) {
  return programs.find((p) => p.id === programId) ?? getProgramBySlug(programId);
}

/**
 * Read-only, joined view for the Phase 1 admin screen. Uses the service-role
 * client (bypasses RLS) because this needs to see every family's
 * registrations — never call this from a "use client" file or expose its
 * result beyond the server-rendered admin page.
 */
export async function listAdminRegistrations(): Promise<AdminRegistrationRow[]> {
  const supabase = createAdminClient();

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("*, families(parent_name, email, phone)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!registrations || registrations.length === 0) return [];

  const participantIds = registrations.map((r) => r.participant_id as string);
  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, grade, school")
    .in("id", participantIds);
  if (childrenError) throw new Error(childrenError.message);
  const childById = new Map((children ?? []).map((c) => [c.id as string, c]));

  const paymentIds = registrations
    .map((r) => r.payment_id as string | null)
    .filter((id): id is string => Boolean(id));

  const { data: payments, error: paymentsError } =
    paymentIds.length > 0
      ? await supabase.from("payments").select("id, status").in("id", paymentIds)
      : { data: [], error: null };
  if (paymentsError) throw new Error(paymentsError.message);

  const paymentStatusById = new Map(
    (payments ?? []).map((p) => [p.id as string, p.status as PaymentStatus])
  );

  const registrationIds = registrations.map((r) => r.id as string);
  const { data: cancellationRequests, error: cancellationError } =
    registrationIds.length > 0
      ? await supabase
          .from("cancellation_requests")
          .select("registration_id, preferred_resolution, reason, created_at")
          .in("registration_id", registrationIds)
      : { data: [], error: null };
  if (cancellationError) throw new Error(cancellationError.message);
  const cancellationByRegistrationId = new Map(
    (cancellationRequests ?? []).map((c) => [c.registration_id as string, c])
  );

  return registrations.map((registration) => {
    const program = getProgramById(registration.program_id as string);
    const family = registration.families as { parent_name: string; email: string; phone: string } | null;
    const child = childById.get(registration.participant_id as string);
    const paymentId = registration.payment_id as string | null;
    const cancellation = cancellationByRegistrationId.get(registration.id as string);
    return {
      registrationId: registration.id as string,
      parentName: family?.parent_name ?? "Unknown",
      parentEmail: family?.email ?? "",
      parentPhone: family?.phone ?? "",
      participantName: registration.participant_name as string,
      childSchool: child?.school ?? null,
      childGrade: child?.grade ?? null,
      programName: program?.name ?? (registration.program_id as string),
      sessionLabel: registration.session_label as string,
      sessionDateRange: registration.session_date_range as string | null,
      schoolLocation: registration.school_location as string | null,
      rateType: (registration.rate_type as "daily" | "weekly" | null) ?? null,
      registeredAt: registration.created_at as string,
      amount: Number(registration.price),
      paymentStatus: paymentId ? (paymentStatusById.get(paymentId) ?? "pending") : "pending",
      paymentMethod: registration.payment_method as RegistrationPaymentMethod,
      registrationStatus: registration.status as string,
      cancellationRequested: Boolean(cancellation),
      cancellationReason: (cancellation?.reason as string) ?? null,
      preferredResolution: (cancellation?.preferred_resolution as CancellationResolution) ?? null,
      cancellationRequestDate: (cancellation?.created_at as string) ?? null,
    } satisfies AdminRegistrationRow;
  });
}

/** One row per registration, with every field the Excel export needs. */
export interface AdminExportRow {
  registrationId: string;
  registeredAt: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string | null;
  childDob: string | null;
  childGrade: string | null;
  currentSchool: string | null;
  programName: string;
  sessionLabel: string;
  sessionDateRange: string | null;
  /** School/location chosen at registration time for site-based programs (e.g. After School) — distinct from currentSchool, the child's current school on their profile. */
  schoolLocation: string | null;
  rateType: "daily" | "weekly" | null;
  /** Number of individual days (rateType "daily") or weeks (rateType "weekly") selected — null for flat-rate sessions. */
  unitCount: number | null;
  programLocation: string | null;
  amount: number;
  paymentMethod: RegistrationPaymentMethod;
  paymentStatus: PaymentStatus | "pending";
  registrationStatus: string;
  cancellationStatus: "Cancellation Requested" | "";
  preferredResolution: CancellationResolution | null;
  cancellationReason: string | null;
  requestDate: string | null;
}

/**
 * Full joined export used only by the admin Excel download — same
 * service-role access pattern as listAdminRegistrations above, never
 * reachable from a client component.
 */
export async function listAdminExportRows(): Promise<AdminExportRow[]> {
  const supabase = createAdminClient();

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("*, families(parent_name, email, phone)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!registrations || registrations.length === 0) return [];

  const participantIds = registrations.map((r) => r.participant_id as string);
  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("id, first_name, last_name, dob, grade, school")
    .in("id", participantIds);
  if (childrenError) throw new Error(childrenError.message);
  const childById = new Map((children ?? []).map((c) => [c.id as string, c]));

  const paymentIds = registrations
    .map((r) => r.payment_id as string | null)
    .filter((id): id is string => Boolean(id));
  const { data: payments, error: paymentsError } =
    paymentIds.length > 0
      ? await supabase.from("payments").select("id, status").in("id", paymentIds)
      : { data: [], error: null };
  if (paymentsError) throw new Error(paymentsError.message);
  const paymentStatusById = new Map(
    (payments ?? []).map((p) => [p.id as string, p.status as PaymentStatus])
  );

  const registrationIds = registrations.map((r) => r.id as string);
  const { data: cancellationRequests, error: cancellationError } = await supabase
    .from("cancellation_requests")
    .select("registration_id, preferred_resolution, reason, created_at")
    .in("registration_id", registrationIds);
  if (cancellationError) throw new Error(cancellationError.message);
  const cancellationByRegistrationId = new Map(
    (cancellationRequests ?? []).map((c) => [c.registration_id as string, c])
  );

  return registrations.map((registration) => {
    const program = getProgramById(registration.program_id as string);
    const family = registration.families as { parent_name: string; email: string; phone: string } | null;
    const child = childById.get(registration.participant_id as string);
    const paymentId = registration.payment_id as string | null;
    const cancellation = cancellationByRegistrationId.get(registration.id as string);
    const rateType = (registration.rate_type as "daily" | "weekly" | null) ?? null;
    const selectedDates = registration.selected_dates as string[] | null;
    const selectedWeeks = registration.selected_weeks as unknown[] | null;
    const unitCount =
      rateType === "daily" ? (selectedDates?.length ?? 0) : rateType === "weekly" ? (selectedWeeks?.length ?? 0) : null;

    return {
      registrationId: registration.id as string,
      registeredAt: registration.created_at as string,
      parentName: family?.parent_name ?? "Unknown",
      parentEmail: family?.email ?? "",
      parentPhone: family?.phone ?? "",
      childName: child ? `${child.first_name} ${child.last_name}` : null,
      childDob: child?.dob ?? null,
      childGrade: child?.grade ?? null,
      currentSchool: child?.school ?? null,
      programName: program?.name ?? (registration.program_id as string),
      sessionLabel: registration.session_label as string,
      sessionDateRange: registration.session_date_range as string | null,
      schoolLocation: registration.school_location as string | null,
      rateType,
      unitCount,
      programLocation: program?.location ?? "Location TBD",
      amount: Number(registration.price),
      paymentMethod: registration.payment_method as RegistrationPaymentMethod,
      paymentStatus: paymentId ? (paymentStatusById.get(paymentId) ?? "pending") : "pending",
      registrationStatus: registration.status as string,
      cancellationStatus: cancellation ? "Cancellation Requested" : "",
      preferredResolution: (cancellation?.preferred_resolution as CancellationResolution) ?? null,
      cancellationReason: (cancellation?.reason as string) ?? null,
      requestDate: (cancellation?.created_at as string) ?? null,
    } satisfies AdminExportRow;
  });
}
