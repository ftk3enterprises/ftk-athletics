import type { Family, Program, TShirtSize, User } from "@/types";

export type ParticipantKind = "self" | "child" | "adult";

export interface ResolvedParticipant {
  /** The id as it appears in draft.participantIds / registration-draft-context (the literal "self", or a children/family_adults row id). */
  id: string;
  /** The id a Registration row actually stores as participant_id — user.id for "self", same as `id` otherwise. */
  resolvedId: string;
  name: string;
  /** Short descriptive line shown under the name (grade for a child, "Myself"/"Adult" otherwise). */
  meta: string;
  kind: ParticipantKind;
  tshirtSize: TShirtSize | null;
}

/**
 * Resolves a draft participant id (the "self" sentinel, a child id, or a
 * family_adults id) against the signed-in user/family. Centralizes the
 * three-way branch that every registration-flow step needs (participants,
 * schedule, details, waiver, review) so a new participant kind never has to
 * be added to five files independently.
 */
export function resolveParticipant(
  id: string,
  user: User,
  family: Family
): ResolvedParticipant | null {
  if (id === "self") {
    return {
      id: "self",
      resolvedId: user.id,
      name: user.name,
      meta: "Myself",
      kind: "self",
      tshirtSize: family.tshirtSize,
    };
  }
  const child = family.children.find((c) => c.id === id);
  if (child) {
    return {
      id: child.id,
      resolvedId: child.id,
      name: `${child.firstName} ${child.lastName}`,
      meta: child.grade,
      kind: "child",
      tshirtSize: child.tshirtSize,
    };
  }
  const adult = family.adults.find((a) => a.id === id);
  if (adult) {
    return {
      id: adult.id,
      resolvedId: adult.id,
      name: `${adult.firstName} ${adult.lastName}`,
      meta: "Adult",
      kind: "adult",
      tshirtSize: adult.tshirtSize,
    };
  }
  return null;
}

/**
 * Whether a participant of the given kind is eligible to register for a
 * program, based solely on Program.participantType — never a hardcoded
 * program name/id, so a newly added adult/family program is automatically
 * correct with no changes here. "self" and "adult" are both adults for
 * this purpose; only "child" counts as youth. Shared by the client
 * (registration UI) and the server (POST /api/registrations) so the rule
 * can never drift between the two.
 */
export function isProgramCompatible(program: Program, kind: ParticipantKind): boolean {
  if (program.participantType === "family") return true;
  return kind === "child" ? program.participantType === "youth" : program.participantType === "adult";
}
