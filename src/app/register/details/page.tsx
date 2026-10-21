"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { schoolSelectionKey, useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programs } from "@/data/programs";
import { OTHER_SCHOOL_VALUE, SCHOOL_SELECT_OPTIONS } from "@/data/schools";
import type { Program } from "@/types";

interface Participant {
  id: string;
  name: string;
  meta: string;
}

/**
 * draft.schoolSelections stores the resolved label (e.g. "Lakeview Elementary"),
 * the typed custom name, or the literal OTHER_SCHOOL_VALUE sentinel when "Other"
 * was picked but no name has been typed yet.
 */
function schoolSelectCode(storedLabel: string | undefined): string {
  if (!storedLabel) return "";
  if (storedLabel === OTHER_SCHOOL_VALUE) return OTHER_SCHOOL_VALUE;
  const known = SCHOOL_SELECT_OPTIONS.some(
    (s) => s.value !== OTHER_SCHOOL_VALUE && s.label === storedLabel
  );
  return known ? (SCHOOL_SELECT_OPTIONS.find((s) => s.label === storedLabel)?.value ?? "") : OTHER_SCHOOL_VALUE;
}

function isSchoolSelectionComplete(storedLabel: string | undefined): boolean {
  return Boolean(storedLabel) && storedLabel !== OTHER_SCHOOL_VALUE;
}

export default function DetailsPage() {
  const { user, family } = useAuth();
  const { draft, setSchoolSelection } = useRegistrationDraft();
  const router = useRouter();

  const participants: Participant[] = useMemo(() => {
    if (!user || !family) return [];
    return draft.participantIds
      .map((id): Participant | null => {
        if (id === "self") return { id: "self", name: user.name, meta: "Myself" };
        const child = family.children.find((c) => c.id === id);
        return child ? { id: child.id, name: `${child.firstName} ${child.lastName}`, meta: child.grade } : null;
      })
      .filter((p): p is Participant => p !== null);
  }, [draft.participantIds, user, family]);

  const schoolRows = useMemo(() => {
    const rows: { participant: Participant; program: Program }[] = [];
    for (const participant of participants) {
      for (const programId of draft.assignments[participant.id] ?? []) {
        const program = programs.find((p) => p.id === programId);
        // schoolBasedSessions programs (After School) already resolve their
        // school from the chosen session in /register/schedule — showing
        // this picker again would let a parent override it independently of
        // the session they actually picked, leaving schoolLocation and
        // sessionId pointing at two different schools.
        if (program?.requiresSchoolSelection && !program.schoolBasedSessions) {
          rows.push({ participant, program });
        }
      }
    }
    return rows;
  }, [participants, draft.assignments]);

  useEffect(() => {
    if (draft.participantIds.length === 0) {
      router.replace("/register/participants");
    } else if (draft.programIds.length === 0) {
      router.replace("/register/programs");
    } else if (Object.values(draft.assignments).every((ids) => ids.length === 0)) {
      router.replace("/register/schedule");
    } else if (schoolRows.length === 0) {
      // Nothing in this registration needs a school/location — skip straight to the waiver.
      router.replace("/register/waiver");
    }
  }, [draft.participantIds.length, draft.programIds.length, draft.assignments, schoolRows.length, router]);

  if (!user || !family || draft.participantIds.length === 0 || draft.programIds.length === 0 || schoolRows.length === 0) {
    return null;
  }

  const missing = schoolRows.filter(
    ({ participant, program }) => !isSchoolSelectionComplete(draft.schoolSelections[schoolSelectionKey(participant.id, program.id)])
  );
  const canContinue = missing.length === 0;

  return (
    <div className="bg-background">
      <RegistrationHeader title="Program Details" step={4} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl">School / Location</h2>
        <p className="mt-2 text-muted-foreground">
          A couple of your selected programs run at a specific school site — tell us which one
          applies for each participant.
        </p>

        <div className="mt-6 space-y-4">
          {schoolRows.map(({ participant, program }) => {
            const key = schoolSelectionKey(participant.id, program.id);
            const storedSchool = draft.schoolSelections[key];
            const selectCode = schoolSelectCode(storedSchool);
            return (
              <div key={key} className="rounded-sm border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <UserRound className="size-5 text-impact" aria-hidden />
                  <div>
                    <p className="font-semibold text-navy">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {program.name} · {participant.meta}
                    </p>
                  </div>
                </div>

                <div className="mt-4 max-w-xs space-y-2">
                  <Select
                    value={selectCode}
                    onValueChange={(value) => {
                      if (!value) return;
                      if (value === OTHER_SCHOOL_VALUE) {
                        setSchoolSelection(participant.id, program.id, OTHER_SCHOOL_VALUE);
                      } else {
                        const label = SCHOOL_SELECT_OPTIONS.find((s) => s.value === value)?.label ?? "";
                        setSchoolSelection(participant.id, program.id, label);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="Select a school location">
                        {(value: string | null) =>
                          SCHOOL_SELECT_OPTIONS.find((s) => s.value === value)?.label ?? ""
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_SELECT_OPTIONS.map((school) => (
                        <SelectItem key={school.value} value={school.value}>
                          {school.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectCode === OTHER_SCHOOL_VALUE && (
                    <Input
                      placeholder="Enter school name"
                      value={storedSchool === OTHER_SCHOOL_VALUE ? "" : (storedSchool ?? "")}
                      onChange={(e) =>
                        setSchoolSelection(participant.id, program.id, e.target.value || OTHER_SCHOOL_VALUE)
                      }
                      className="h-9 text-sm"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!canContinue && (
          <div className="mt-6 rounded-sm border border-impact/30 bg-impact/5 p-4 text-sm text-navy">
            Select a school location for:{" "}
            {missing.map(({ participant, program }) => `${participant.name} (${program.name})`).join(", ")}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/register/schedule")}
            className="h-12 rounded-sm sm:w-fit sm:px-8"
          >
            Back
          </Button>
          <Button
            onClick={() => router.push("/register/waiver")}
            disabled={!canContinue}
            className="h-12 rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-10"
          >
            Continue To Waiver
          </Button>
        </div>
      </div>
    </div>
  );
}
