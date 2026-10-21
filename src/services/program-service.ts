import { programs, getProgramBySlug, getFeaturedPrograms } from "@/data/programs";
import type { Program } from "@/types";
import { networkDelay } from "@/lib/storage";

/** Reads today come from the centralized mock array; later this becomes a Supabase query. */

export async function listPrograms(): Promise<Program[]> {
  await networkDelay(150);
  return programs;
}

export async function listFeaturedPrograms(): Promise<Program[]> {
  await networkDelay(150);
  return getFeaturedPrograms();
}

export async function getProgram(slug: string): Promise<Program | null> {
  await networkDelay(150);
  return getProgramBySlug(slug) ?? null;
}
