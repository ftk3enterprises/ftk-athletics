import type { Child, Family } from "@/types";
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
}

interface FamilyRow {
  id: string;
  user_id: string;
  parent_name: string;
  email: string;
  phone: string;
  interested_program_ids: string[] | null;
  waiver_accepted: boolean;
  waiver_accepted_at: string | null;
  waiver_version: string | null;
  waiver_withdrawn_at: string | null;
  children: ChildRow[] | null;
}

const FAMILY_SELECT = "*, children(*)";

function toChild(row: ChildRow): Child {
  return {
    id: row.id,
    familyId: row.family_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    grade: row.grade ?? "",
    school: row.school ?? "",
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
    interestedProgramIds: row.interested_program_ids ?? [],
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
      waiver_version: LIABILITY_WAIVER_VERSION,
    })
    .select(FAMILY_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return toFamily(data as unknown as FamilyRow);
}

export async function addChild(
  familyId: string,
  input: { firstName: string; lastName: string; dob: string; grade: string; school: string }
): Promise<Family> {
  const supabase = createClient();
  const { error } = await supabase.from("children").insert({
    family_id: familyId,
    first_name: input.firstName,
    last_name: input.lastName,
    dob: input.dob,
    grade: input.grade,
    school: input.school,
  });
  if (error) throw new Error(error.message);
  return getFamilyByIdOrThrow(familyId);
}

export async function updateChild(
  familyId: string,
  childId: string,
  input: Partial<Pick<Child, "firstName" | "lastName" | "dob" | "grade" | "school">>
): Promise<Family> {
  const supabase = createClient();
  const patch: Record<string, string> = {};
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.dob !== undefined) patch.dob = input.dob;
  if (input.grade !== undefined) patch.grade = input.grade;
  if (input.school !== undefined) patch.school = input.school;

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
