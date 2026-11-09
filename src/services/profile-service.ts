import type { Child, Family, FamilyAdult, TShirtSize } from "@/types";
import { LIABILITY_WAIVER_VERSION } from "@/data/config";
import { createClient } from "@/lib/supabase/client";

interface ChildRow {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  grade: string | null;
  school: string | null;
  tshirt_size: TShirtSize | null;
}

interface FamilyAdultRow {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string;
  tshirt_size: TShirtSize | null;
}

interface FamilyRow {
  id: string;
  user_id: string;
  parent_name: string;
  email: string;
  phone: string;
  tshirt_size: TShirtSize | null;
  interested_program_ids: string[] | null;
  interested_coaching: boolean;
  interested_volunteering: boolean;
  interested_sponsorship: boolean;
  waiver_accepted: boolean;
  waiver_accepted_at: string | null;
  waiver_version: string | null;
  waiver_withdrawn_at: string | null;
  children: ChildRow[] | null;
  family_adults: FamilyAdultRow[] | null;
}

const FAMILY_SELECT = "*, children(*), family_adults(*)";

function toChild(row: ChildRow): Child {
  return {
    id: row.id,
    familyId: row.family_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    grade: row.grade ?? "",
    school: row.school ?? "",
    tshirtSize: row.tshirt_size,
  };
}

function toAdult(row: FamilyAdultRow): FamilyAdult {
  return {
    id: row.id,
    familyId: row.family_id,
    firstName: row.first_name,
    lastName: row.last_name,
    tshirtSize: row.tshirt_size,
  };
}

function toFamily(row: FamilyRow): Family {
  return {
    id: row.id,
    userId: row.user_id,
    parentName: row.parent_name,
    email: row.email,
    phone: row.phone,
    children: (row.children ?? []).map(toChild),
    adults: (row.family_adults ?? []).map(toAdult),
    tshirtSize: row.tshirt_size,
    interestedProgramIds: row.interested_program_ids ?? [],
    interestedInCoaching: row.interested_coaching,
    interestedInVolunteering: row.interested_volunteering,
    interestedInSponsorship: row.interested_sponsorship,
    waiver: {
      familyId: row.id,
      accepted: row.waiver_accepted,
      acceptedAt: row.waiver_accepted_at,
      version: row.waiver_version ?? LIABILITY_WAIVER_VERSION,
      withdrawnAt: row.waiver_withdrawn_at,
    },
  };
}

export async function getFamilyByUserId(userId: string): Promise<Family | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("families")
    .select(FAMILY_SELECT)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toFamily(data as unknown as FamilyRow) : null;
}

export async function createFamily(input: {
  userId: string;
  parentName: string;
  email: string;
  phone: string;
  interestedProgramIds?: string[];
  interestedInCoaching?: boolean;
  interestedInVolunteering?: boolean;
  interestedInSponsorship?: boolean;
}): Promise<Family> {
  const existing = await getFamilyByUserId(input.userId);
  if (existing) return existing;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("families")
    .insert({
      user_id: input.userId,
      parent_name: input.parentName,
      email: input.email,
      phone: input.phone,
      interested_program_ids: input.interestedProgramIds ?? [],
      interested_coaching: input.interestedInCoaching ?? false,
      interested_volunteering: input.interestedInVolunteering ?? false,
      interested_sponsorship: input.interestedInSponsorship ?? false,
      waiver_version: LIABILITY_WAIVER_VERSION,
    })
    .select(FAMILY_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return toFamily(data as unknown as FamilyRow);
}

/**
 * Updates the three optional involvement preferences from My Profile.
 * Writable directly by the owning family's own client — see the
 * column-level grant added alongside these columns in migration 0007.
 */
export async function updateFamilyPreferences(
  familyId: string,
  input: {
    interestedInCoaching: boolean;
    interestedInVolunteering: boolean;
    interestedInSponsorship: boolean;
  }
): Promise<Family> {
  const supabase = createClient();
  const { error } = await supabase
    .from("families")
    .update({
      interested_coaching: input.interestedInCoaching,
      interested_volunteering: input.interestedInVolunteering,
      interested_sponsorship: input.interestedInSponsorship,
    })
    .eq("id", familyId);
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function addChild(
  familyId: string,
  input: { firstName: string; lastName: string; dob: string; grade: string; school: string; tshirtSize: TShirtSize }
): Promise<Family> {
  const supabase = createClient();
  const { error } = await supabase.from("children").insert({
    family_id: familyId,
    first_name: input.firstName,
    last_name: input.lastName,
    dob: input.dob,
    grade: input.grade,
    school: input.school,
    tshirt_size: input.tshirtSize,
  });
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function updateChild(
  familyId: string,
  childId: string,
  input: Partial<Pick<Child, "firstName" | "lastName" | "dob" | "grade" | "school" | "tshirtSize">>
): Promise<Family> {
  const supabase = createClient();
  const patch: Record<string, string | null> = {};
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.dob !== undefined) patch.dob = input.dob;
  if (input.grade !== undefined) patch.grade = input.grade;
  if (input.school !== undefined) patch.school = input.school;
  if (input.tshirtSize !== undefined) patch.tshirt_size = input.tshirtSize;

  const { error } = await supabase.from("children").update(patch).eq("id", childId);
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function removeChild(familyId: string, childId: string): Promise<Family> {
  const supabase = createClient();
  const { error } = await supabase.from("children").delete().eq("id", childId);
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

/**
 * Sets the signed-in account holder's own T-shirt size — writable directly
 * by the owning family's own client, same column-level grant pattern as
 * updateFamilyPreferences (see migration 0010).
 */
export async function updateFamilyTshirtSize(familyId: string, tshirtSize: TShirtSize): Promise<Family> {
  const supabase = createClient();
  const { error } = await supabase
    .from("families")
    .update({ tshirt_size: tshirtSize })
    .eq("id", familyId);
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function addAdult(
  familyId: string,
  input: { firstName: string; lastName: string; tshirtSize: TShirtSize }
): Promise<Family> {
  const supabase = createClient();
  const { error } = await supabase.from("family_adults").insert({
    family_id: familyId,
    first_name: input.firstName,
    last_name: input.lastName,
    tshirt_size: input.tshirtSize,
  });
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function updateAdult(
  familyId: string,
  adultId: string,
  input: Partial<Pick<FamilyAdult, "firstName" | "lastName" | "tshirtSize">>
): Promise<Family> {
  const supabase = createClient();
  const patch: Record<string, string | null> = {};
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.tshirtSize !== undefined) patch.tshirt_size = input.tshirtSize;

  const { error } = await supabase.from("family_adults").update(patch).eq("id", adultId);
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function removeAdult(familyId: string, adultId: string): Promise<Family> {
  const supabase = createClient();
  const { error } = await supabase.from("family_adults").delete().eq("id", adultId);
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function getFamilyById(familyId: string): Promise<Family | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("families")
    .select(FAMILY_SELECT)
    .eq("id", familyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toFamily(data as unknown as FamilyRow) : null;
}

async function getFamilyByIdOrThrow(familyId: string): Promise<Family> {
  const family = await getFamilyById(familyId);
  if (!family) throw new Error("Family not found.");
  return family;
}
