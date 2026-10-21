"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { schoolSelectionKey, sessionSelectionKey, useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { Button } from "@/components/ui/button";
import { programs } from "@/data/programs";
import * as registrationService from "@/services/registration-service";
import { formatSelectedDatesLabel, formatSelectedWeeksLabel } from "@/lib/schedule-dates";
import { calculateSessionPrice, resolveSelectedWeeks } from "@/lib/pricing";
import type { ProgramWeek } from "@/types";

interface Line {
  participantId: string;
  participantName: string;
  programId: string;
  programName: string;
  sessionId: string;
  sessionLabel: string;
  sessionDateRange: string | null;
  price: number;
  schoolLocation: string | null;
  rateType: "daily" | "weekly" | null;
  selectedDates: string[] | null;
  selectedWeeks: ProgramWeek[] | null;
  priceBreakdownLabel: string | null;
}

export default function ReviewPage() {
  const { user, family } = useAuth();
  const { draft, setRegistrationIds } = useRegistrationDraft();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines: Line[] = useMemo(() => {
    if (!user || !family) return [];
    const result: Line[] = [];
    for (const participantId of draft.participantIds) {
      const participantName =
        participantId === "self"
          ? user.name
          : (() => {
              const child = family.children.find((c) => c.id === participantId);
              return child ? `${child.firstName} ${child.lastName}` : "Participant";
            })();
      for (const programId of draft.assignments[participantId] ?? []) {
        const program = programs.find((p) => p.id === programId);
        if (!program) continue;
        const sessionIds = draft.sessionSelections[sessionSelectionKey(participantId, programId)] ?? [];
        for (const sessionId of sessionIds) {
          const session = program.sessions.find((s) => s.id === sessionId);
          if (!session) continue;

          let sessionDateRange = session.dateRange;
          let rateType: "daily" | "weekly" | null = null;
          let selectedDates: string[] | null = null;
          let selectedWeeks: ProgramWeek[] | null = null;

          const value = draft.dateSelections[sessionSelectionKey(participantId, programId)] ?? {};
          if (session.dateSelection) {
            rateType = session.dateSelection.type;
            if (session.dateSelection.type === "daily") {
              selectedDates = value.dates ?? [];
              sessionDateRange = formatSelectedDatesLabel(selectedDates);
            } else {
              selectedWeeks = resolveSelectedWeeks(session, value.weekIds);
              sessionDateRange = formatSelectedWeeksLabel(selectedWeeks);
            }
          }
          const price = calculateSessionPrice(session, value);

          result.push({
            participantId,
            participantName,
            programId,
            programName: program.name,
            sessionId: session.id,
            sessionLabel: session.label,
            sessionDateRange,
            price,
            schoolLocation: draft.schoolSelections[schoolSelectionKey(participantId, programId)] ?? null,
            rateType,
            selectedDates,
            selectedWeeks,
            priceBreakdownLabel: program.priceBreakdown
              ? `$${program.priceBreakdown.unitPrice}/${program.priceBreakdown.unitLabel} × ${program.priceBreakdown.units} ${program.priceBreakdown.unitsLabel}s`
              : null,
          });
        }
      }
    }
    return result;
  }, [
    draft.participantIds,
    draft.assignments,
    draft.sessionSelections,
    draft.schoolSelections,
    draft.dateSelections,
    user,
    family,
  ]);

  useEffect(() => {
    if (draft.participantIds.length === 0) router.replace("/register/participants");
    else if (draft.programIds.length === 0) router.replace("/register/programs");
    else if (!family?.waiver.accepted) router.replace("/register/waiver");
    else if (lines.length === 0) router.replace("/register/schedule");
  }, [draft.participantIds.length, draft.programIds.length, family?.waiver.accepted, lines.length, router]);

  const grouped = useMemo(() => {
    const map = new Map<string, { participantName: string; lines: Line[] }>();
    for (const line of lines) {
      const group = map.get(line.participantId) ?? { participantName: line.participantName, lines: [] };
      group.lines.push(line);
      map.set(line.participantId, group);
    }
    return Array.from(map.values());
  }, [lines]);

  const total = lines.reduce((sum, line) => sum + line.price, 0);

  if (!user || !family || lines.length === 0 || !family.waiver.accepted) return null;

  async function handleContinue() {
    setBusy(true);
    setError(null);
    try {
      const created = await registrationService.createRegistrations(
        lines.map((line) => ({
          participantId: line.participantId === "self" ? user!.id : line.participantId,
          programId: line.programId,
          sessionId: line.sessionId,
          schoolLocation: line.schoolLocation,
          dates: line.selectedDates ?? undefined,
          weekIds: line.selectedWeeks?.map((w) => w.id) ?? undefined,
        }))
      );
      setRegistrationIds(created.map((r) => r.id));
      router.push("/register/payment");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong creating your registrations. Please try again."
      );
      setBusy(false);
    }
  }

  return (
    <div className="bg-background">
      <RegistrationHeader title="Review Your Registration" step={6} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.participantName} className="rounded-sm border border-border">
              <div className="border-b border-border bg-muted/40 px-5 py-3">
                <p className="font-heading text-lg text-navy">{group.participantName}</p>
              </div>
              <div className="divide-y divide-border">
                {group.lines.map((line) => (
                  <div
                    key={`${line.programId}:${line.sessionId}`}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <span className="text-navy">
                      {line.programName}
                      <span className="block text-xs text-muted-foreground">
                        {line.sessionLabel}
                        {line.sessionDateRange ? ` · ${line.sessionDateRange}` : ""}
                      </span>
                      {line.schoolLocation && (
                        <span className="block text-xs text-muted-foreground">{line.schoolLocation}</span>
                      )}
                      {line.priceBreakdownLabel && (
                        <span className="block text-xs text-muted-foreground">{line.priceBreakdownLabel}</span>
                      )}
                    </span>
                    <span className="font-medium text-navy">${line.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2.5 rounded-sm border border-carolina/40 bg-carolina/10 p-4 text-sm">
          <CheckCircle2 className="size-5 shrink-0 text-carolina" aria-hidden />
          <span className="text-navy">Waiver — Signed</span>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <span className="text-sm text-muted-foreground">
            {lines.length} registration{lines.length === 1 ? "" : "s"}
          </span>
          <span className="text-2xl text-navy">Total ${total}</span>
        </div>

        {error && <p className="mt-4 text-sm text-impact">{error}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/register/details")}
            className="h-12 rounded-sm sm:w-fit sm:px-8"
          >
            Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={busy}
            className="h-12 rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-10"
          >
            {busy ? "Preparing Checkout..." : "Continue To Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
