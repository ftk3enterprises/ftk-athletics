"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  sessionSelectionKey,
  useRegistrationDraft,
  type DateSelectionValue,
} from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { DateSelectionPicker } from "@/components/registration/date-selection-picker";
import { AfterSchoolScheduleBlock } from "@/components/registration/after-school-schedule-block";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { programs } from "@/data/programs";
import { formatProgramPriceDisplay } from "@/lib/pricing";
import * as registrationService from "@/services/registration-service";
import type { Program, ProgramSession, Registration } from "@/types";

function isDateSelectionComplete(value: DateSelectionValue | undefined): boolean {
  return Boolean(value && ((value.dates?.length ?? 0) > 0 || (value.weekIds?.length ?? 0) > 0));
}

interface Participant {
  id: string;
  resolvedId: string;
  name: string;
  meta: string;
  kind: "self" | "child";
}

function isCompatible(program: Program, kind: "self" | "child") {
  if (program.participantType === "family") return true;
  return kind === "self" ? program.participantType === "adult" : program.participantType === "youth";
}

export default function SchedulePage() {
  const { user, family } = useAuth();
  const { draft, toggleAssignment, setSessionSelection, setDateSelection } = useRegistrationDraft();
  const router = useRouter();
  const [purchased, setPurchased] = useState<Registration[] | null>(null);

  useEffect(() => {
    if (draft.participantIds.length === 0) router.replace("/register/participants");
    else if (draft.programIds.length === 0) router.replace("/register/programs");
  }, [draft.participantIds.length, draft.programIds.length, router]);

  useEffect(() => {
    if (!family) return;
    let active = true;
    registrationService.listRegistrationsByFamily(family.id).then((regs) => {
      if (!active) return;
      setPurchased(regs.filter((r) => r.status !== "cancelled"));
    });
    return () => {
      active = false;
    };
  }, [family]);

  /** Dates this participant already has a non-cancelled registration for, under this exact session. */
  function purchasedDates(resolvedParticipantId: string, programId: string, sessionId: string): string[] {
    return (purchased ?? [])
      .filter((r) => r.participantId === resolvedParticipantId && r.programId === programId && r.sessionId === sessionId)
      .flatMap((r) => r.selectedDates ?? []);
  }

  /**
   * Daily-rate camp sessions are bought incrementally — one existing
   * registration only exhausts the days it actually covers, not the whole
   * session, so a family can come back and buy the remaining days later.
   * Every other session type (leagues, weekly-rate, school-based,
   * flat-rate) is still bought exactly once.
   */
  function isSessionFullyPurchased(participant: Participant, program: Program, session: ProgramSession): boolean {
    if (session.dateSelection?.type === "daily") {
      const available = session.dateSelection.availableDates ?? [];
      const owned = new Set(purchasedDates(participant.resolvedId, program.id, session.id));
      return available.length > 0 && available.every((d) => owned.has(d));
    }
    return (purchased ?? []).some(
      (r) => r.participantId === participant.resolvedId && r.programId === program.id && r.sessionId === session.id
    );
  }

  const participants: Participant[] = useMemo(() => {
    if (!user || !family) return [];
    return draft.participantIds
      .map((id): Participant | null => {
        if (id === "self") return { id: "self", resolvedId: user.id, name: user.name, meta: "Myself", kind: "self" };
        const child = family.children.find((c) => c.id === id);
        return child
          ? { id: child.id, resolvedId: child.id, name: `${child.firstName} ${child.lastName}`, meta: child.grade, kind: "child" }
          : null;
      })
      .filter((p): p is Participant => p !== null);
  }, [draft.participantIds, user, family]);

  const selectedPrograms = useMemo(
    () => draft.programIds.map((id) => programs.find((p) => p.id === id)).filter((p): p is Program => Boolean(p)),
    [draft.programIds]
  );

  if (!user || !family || draft.participantIds.length === 0 || draft.programIds.length === 0 || purchased === null) {
    return null;
  }

  function availableSessions(participant: Participant, program: Program): ProgramSession[] {
    return program.sessions.filter((s) => !isSessionFullyPurchased(participant, program, s));
  }

  function hasAnyRegistration(resolvedParticipantId: string, programId: string, sessionId: string): boolean {
    return (purchased ?? []).some(
      (r) => r.participantId === resolvedParticipantId && r.programId === programId && r.sessionId === sessionId
    );
  }

  /** Other participants assigned to the same program+session — lets a date/week pick be copied across siblings attending together. */
  function siblingsSharingSession(current: Participant, program: Program, sessionId: string): Participant[] {
    return participants.filter((p) => {
      if (p.id === current.id) return false;
      if (!draft.assignments[p.id]?.includes(program.id)) return false;
      const selected = draft.sessionSelections[sessionSelectionKey(p.id, program.id)] ?? [];
      return selected.includes(sessionId);
    });
  }

  function renderDatePicker(participant: Participant, program: Program, session: ProgramSession) {
    if (!session.dateSelection) return null;
    const key = sessionSelectionKey(participant.id, program.id);
    const value = draft.dateSelections[key] ?? {};
    const siblings = siblingsSharingSession(participant, program, session.id);

    // Daily-rate camps: hide any dates this participant already has a
    // registration for, so the picker only ever offers what's actually
    // left to buy (and prices only the new selection, not a re-purchase).
    const pickerSession: ProgramSession =
      session.dateSelection.type === "daily"
        ? {
            ...session,
            dateSelection: {
              ...session.dateSelection,
              availableDates: (session.dateSelection.availableDates ?? []).filter(
                (d) => !purchasedDates(participant.resolvedId, program.id, session.id).includes(d)
              ),
            },
          }
        : session;

    return (
      <div className="ml-8">
        <DateSelectionPicker
          session={pickerSession}
          value={value}
          onChange={(next) => setDateSelection(participant.id, program.id, next)}
        />
        {isDateSelectionComplete(value) && siblings.length > 0 && (
          <button
            type="button"
            onClick={() => {
              for (const sibling of siblings) setDateSelection(sibling.id, program.id, value);
            }}
            className="mt-2 text-xs font-semibold uppercase tracking-wide text-impact hover:underline"
          >
            Use These Same Dates For {siblings.map((s) => s.name).join(", ")}
          </button>
        )}
      </div>
    );
  }

  function handleToggleAssignment(participant: Participant, program: Program) {
    const willAssign = !(draft.assignments[participant.id]?.includes(program.id));
    toggleAssignment(participant.id, program.id);
    // School-based programs (After School) always have several placeholder
    // sessions (one per school) even before any school has a configured
    // date — auto-selecting "the only session" doesn't apply here, the
    // parent always picks a school first via AfterSchoolScheduleBlock.
    if (willAssign && !program.schoolBasedSessions) {
      const available = availableSessions(participant, program);
      if (available.length === 1) {
        setSessionSelection(participant.id, program.id, available[0].id, program.sessionSelectionMode);
      }
    }
  }

  const unassignedParticipants = participants.filter((p) => !(draft.assignments[p.id]?.length > 0));
  const assignedProgramIds = new Set(Object.values(draft.assignments).flat());
  const unassignedPrograms = selectedPrograms.filter((program) => !assignedProgramIds.has(program.id));

  const missingSessionSelections: { participant: Participant; program: Program }[] = [];
  const missingDateSelections: { participant: Participant; program: Program; session: ProgramSession }[] = [];
  for (const participant of participants) {
    for (const programId of draft.assignments[participant.id] ?? []) {
      const program = selectedPrograms.find((p) => p.id === programId);
      if (!program) continue;
      const key = sessionSelectionKey(participant.id, programId);
      const selected = draft.sessionSelections[key] ?? [];
      if (selected.length === 0) {
        missingSessionSelections.push({ participant, program });
        continue;
      }
      for (const sessionId of selected) {
        const session = program.sessions.find((s) => s.id === sessionId);
        if (session?.dateSelection && !isDateSelectionComplete(draft.dateSelections[key])) {
          missingDateSelections.push({ participant, program, session });
        }
      }
    }
  }

  const canContinue =
    unassignedParticipants.length === 0 &&
    unassignedPrograms.length === 0 &&
    missingSessionSelections.length === 0 &&
    missingDateSelections.length === 0;

  return (
    <div className="bg-background">
      <RegistrationHeader title="Which Sessions?" step={3} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl">Pick Weeks, Months, Or Dates</h2>
        <p className="mt-2 text-muted-foreground">
          Check each program that applies to each participant, then choose which session(s) they&apos;re
          registering for.
        </p>

        <div className="mt-6 space-y-6">
          {participants.map((participant) => {
            const compatiblePrograms = selectedPrograms.filter((program) => isCompatible(program, participant.kind));
            return (
              <div key={participant.id} className="rounded-sm border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <UserRound className="size-6 text-impact" aria-hidden />
                  <div>
                    <p className="font-semibold text-navy">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">{participant.meta}</p>
                  </div>
                </div>

                {compatiblePrograms.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    None of the selected programs apply to {participant.name}.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    {compatiblePrograms.map((program) => {
                      const assigned = draft.assignments[participant.id]?.includes(program.id) ?? false;

                      if (program.schoolBasedSessions) {
                        return (
                          <div key={program.id} className="rounded-sm px-2 py-1.5 hover:bg-muted/60">
                            <label className="flex cursor-pointer items-center gap-3">
                              <Checkbox
                                checked={assigned}
                                onCheckedChange={() => handleToggleAssignment(participant, program)}
                              />
                              <span className="text-sm text-navy">{program.name}</span>
                              <span className="ml-auto text-sm text-muted-foreground">${program.price}</span>
                            </label>
                            {assigned && (
                              <AfterSchoolScheduleBlock
                                participantId={participant.id}
                                program={program}
                                isPurchased={(sessionId) =>
                                  hasAnyRegistration(participant.resolvedId, program.id, sessionId)
                                }
                              />
                            )}
                          </div>
                        );
                      }

                      const available = availableSessions(participant, program);
                      const fullyRegistered = available.length === 0;
                      const selectedSessionIds = draft.sessionSelections[sessionSelectionKey(participant.id, program.id)] ?? [];
                      const showSessionPicker = assigned && available.length > 1;

                      return (
                        <div key={program.id} className="rounded-sm px-2 py-1.5 hover:bg-muted/60">
                          <label
                            className={`flex items-center gap-3 ${fullyRegistered ? "cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <Checkbox
                              checked={assigned}
                              disabled={fullyRegistered}
                              onCheckedChange={() => handleToggleAssignment(participant, program)}
                            />
                            <span className="text-sm text-navy">{program.name}</span>
                            {fullyRegistered ? (
                              <span className="ml-auto inline-flex items-center gap-1 rounded-sm bg-carolina/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-navy">
                                <CheckCircle2 className="size-3" aria-hidden />
                                Already Registered
                              </span>
                            ) : (
                              available.length === 1 && (
                                <span className="ml-auto text-sm text-muted-foreground">${available[0].price}</span>
                              )
                            )}
                          </label>

                          {assigned && available.length === 1 && (
                            <>
                              <p className="ml-8 mt-1 text-xs text-muted-foreground">
                                {available[0].label}
                                {available[0].dateRange ? ` · ${available[0].dateRange}` : ""}
                                {program.priceBreakdown
                                  ? ` · ${formatProgramPriceDisplay(program).sublabel}`
                                  : ""}
                              </p>
                              {renderDatePicker(participant, program, available[0])}
                            </>
                          )}

                          {showSessionPicker && (
                            <div className="ml-8 mt-2 space-y-1.5">
                              {program.sessions.map((session) => {
                                const isPurchased = hasAnyRegistration(
                                  participant.resolvedId,
                                  program.id,
                                  session.id
                                );
                                const isSelected = selectedSessionIds.includes(session.id);
                                if (isPurchased) {
                                  return (
                                    <div
                                      key={session.id}
                                      className="flex items-center justify-between rounded-sm border border-carolina/30 bg-carolina/10 px-3 py-2 text-sm"
                                    >
                                      <div>
                                        <p className="font-medium text-navy">{session.label}</p>
                                        {session.dateRange && (
                                          <p className="text-xs text-muted-foreground">{session.dateRange}</p>
                                        )}
                                      </div>
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-navy">
                                        <CheckCircle2 className="size-3.5 text-carolina" aria-hidden />
                                        Paid
                                      </span>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={session.id}>
                                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-border px-3 py-2 text-sm transition-colors hover:border-navy">
                                      <span className="flex items-center gap-3">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            setSessionSelection(participant.id, program.id, session.id, program.sessionSelectionMode)
                                          }
                                        />
                                        <span>
                                          <span className="block font-medium text-navy">{session.label}</span>
                                          {session.dateRange && (
                                            <span className="block text-xs text-muted-foreground">{session.dateRange}</span>
                                          )}
                                          {program.priceBreakdown && (
                                            <span className="block text-xs text-muted-foreground">
                                              {formatProgramPriceDisplay(program).sublabel}
                                            </span>
                                          )}
                                        </span>
                                      </span>
                                      <span className="shrink-0 font-heading text-sm text-navy">${session.price}</span>
                                    </label>
                                    {isSelected && renderDatePicker(participant, program, session)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!canContinue && (
          <div className="mt-6 space-y-1 rounded-sm border border-impact/30 bg-impact/5 p-4 text-sm text-navy">
            {unassignedParticipants.length > 0 && (
              <p>No program selected for: {unassignedParticipants.map((p) => p.name).join(", ")}</p>
            )}
            {unassignedPrograms.length > 0 && (
              <p>No participant assigned to: {unassignedPrograms.map((p) => p.name).join(", ")}</p>
            )}
            {missingSessionSelections.length > 0 && (
              <p>
                Select a session for:{" "}
                {missingSessionSelections.map(({ participant, program }) => `${participant.name} (${program.name})`).join(", ")}
              </p>
            )}
            {missingDateSelections.length > 0 && (
              <p>
                Select specific day(s)/week(s) for:{" "}
                {missingDateSelections
                  .map(({ participant, program, session }) => `${participant.name} (${program.name} — ${session.label})`)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/register/programs")}
            className="h-12 rounded-sm sm:w-fit sm:px-8"
          >
            Back
          </Button>
          <Button
            onClick={() => router.push("/register/details")}
            disabled={!canContinue}
            className="h-12 rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-10"
          >
            Continue To Details
          </Button>
        </div>
      </div>
    </div>
  );
}
