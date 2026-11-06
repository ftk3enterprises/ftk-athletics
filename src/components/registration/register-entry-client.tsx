"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { getProgramBySlug } from "@/data/programs";

export function RegisterEntryClient({
  programSlug,
  participantId,
}: {
  programSlug?: string;
  participantId?: string;
}) {
  const { family } = useAuth();
  const { reset, seedProgram, seedParticipant, seedAssignment } = useRegistrationDraft();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!family) return; // wait for RegisterGuard to resolve the family before validating participantId
    hasRun.current = true;

    reset();
    const program = programSlug ? getProgramBySlug(programSlug) : undefined;
    // "I'm Interested / Reserve a Spot" on a Coming Soon program drives
    // visitors here the same way an open program's "Register Now" does —
    // seed it too so the flow (minus payment) is identical either way.
    const programSeeded = Boolean(program?.registrationOpen || program?.allowsInterest);
    if (program && programSeeded) seedProgram(program.id);

    const participantIsValid =
      participantId === "self" || family.children.some((c) => c.id === participantId);
    if (participantId && participantIsValid) {
      seedParticipant(participantId);
      if (programSeeded) seedAssignment(participantId, program!.id);
    }

    router.replace("/register/participants");
  }, [programSlug, participantId, family, reset, seedProgram, seedParticipant, seedAssignment, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">
      Preparing your registration...
    </div>
  );
}
