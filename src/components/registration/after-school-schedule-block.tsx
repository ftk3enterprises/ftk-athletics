"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { sessionSelectionKey, useRegistrationDraft } from "@/context/registration-draft-context";
import { SCHOOLS } from "@/data/schools";
import { formatSelectedDatesLabel } from "@/lib/schedule-dates";
import type { Program, ProgramSession } from "@/types";

/**
 * The 3-step after-school registration UX for one participant+program:
 * pick a school, see that school's 4-week sessions (or an empty state),
 * pick one. Reuses the generic sessionSelections/schoolSelections draft
 * state so Review, the API routes, and admin views need no special-casing —
 * picking a session here just also records which school it belongs to.
 */
export function AfterSchoolScheduleBlock({
  participantId,
  program,
  isPurchased,
}: {
  participantId: string;
  program: Program;
  isPurchased: (sessionId: string) => boolean;
}) {
  const { draft, setSessionSelection, setSchoolSelection, clearSessionSelection } = useRegistrationDraft();
  const key = sessionSelectionKey(participantId, program.id);
  const selectedSessionIds = draft.sessionSelections[key] ?? [];
  const selectedSession = program.sessions.find((s) => selectedSessionIds.includes(s.id));

  // Defers to the already-selected session's school until the parent
  // explicitly picks a different one — avoids needing an effect to keep
  // this in sync with draft state.
  const [manualSchoolFilter, setManualSchoolFilter] = useState<string | null>(null);
  const schoolFilter = manualSchoolFilter ?? selectedSession?.schoolId ?? null;

  function handlePickSchool(schoolId: string) {
    if (schoolId !== schoolFilter && selectedSessionIds.length > 0) {
      clearSessionSelection(participantId, program.id);
    }
    setManualSchoolFilter(schoolId);
  }

  function handleSelectSession(session: ProgramSession) {
    setSessionSelection(participantId, program.id, session.id, "single");
    const label = SCHOOLS.find((s) => s.value === session.schoolId)?.label ?? "";
    setSchoolSelection(participantId, program.id, label);
  }

  const schoolSessions = schoolFilter ? program.sessions.filter((s) => s.schoolId === schoolFilter) : [];
  const configuredSessions = schoolSessions.filter((s) => (s.classDates?.length ?? 0) === 4);
  const activeSchool = SCHOOLS.find((s) => s.value === schoolFilter);

  return (
    <div className="ml-8 mt-2 space-y-3 border-t border-border pt-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Step 1 — Choose A School
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SCHOOLS.map((school) => {
            const isActive = schoolFilter === school.value;
            return (
              <button
                key={school.value}
                type="button"
                onClick={() => handlePickSchool(school.value)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "border-impact bg-impact/10 text-navy" : "border-border text-muted-foreground hover:border-navy/40"
                )}
              >
                {school.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeSchool && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step 2 — {activeSchool.label}&apos;s Sessions
          </p>

          {configuredSessions.length === 0 ? (
            <p className="mt-1.5 rounded-sm border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              No sessions are currently scheduled for this location. Please check back for updates.
            </p>
          ) : (
            <div className="mt-1.5 space-y-1.5">
              {configuredSessions.map((session) => {
                const purchased = isPurchased(session.id);
                const isSelected = selectedSessionIds.includes(session.id);

                if (purchased) {
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-sm border border-carolina/30 bg-carolina/10 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-navy">4-Week Session · 3:30 – 4:30 PM</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSelectedDatesLabel(session.classDates ?? [])}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-navy">
                        <Check className="size-3.5 text-carolina" aria-hidden />
                        Paid
                      </span>
                    </div>
                  );
                }

                return (
                  <label
                    key={session.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-border px-3 py-2 text-sm transition-colors hover:border-navy"
                  >
                    <span className="flex items-center gap-3">
                      <Checkbox checked={isSelected} onCheckedChange={() => handleSelectSession(session)} />
                      <span>
                        <span className="block font-medium text-navy">4-Week Session · 3:30 – 4:30 PM</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatSelectedDatesLabel(session.classDates ?? [])}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 font-heading text-sm text-navy">${session.price}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
