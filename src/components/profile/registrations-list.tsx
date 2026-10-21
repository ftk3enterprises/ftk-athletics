"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { programs } from "@/data/programs";
import * as registrationService from "@/services/registration-service";
import * as paymentService from "@/services/payment-service";
import * as cancellationService from "@/services/cancellation-service";
import { CancellationRequestForm } from "@/components/profile/cancellation-request-form";
import { Button } from "@/components/ui/button";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { formatSelectedDatesLabel, formatSelectedWeeksLabel } from "@/lib/schedule-dates";
import { deriveRegistrationUiState, type RegistrationUiState } from "@/lib/registration-status";
import type { Registration } from "@/types";

interface RowData extends Registration {
  programName: string;
  programSlug: string;
  uiState: RegistrationUiState;
  /** Only set for "confirmed" rows paid via Stripe — the family's receipt reference. */
  paymentReference: string | null;
}

const STATE_BADGE_STYLES: Record<RegistrationUiState, string> = {
  awaiting_payment: "bg-impact/15 text-impact",
  step_up_pending: "bg-navy/10 text-navy",
  confirmed: "bg-carolina text-navy",
  cancelled: "bg-ink/10 text-ink",
};

const STATE_BADGE_LABEL: Record<RegistrationUiState, string> = {
  awaiting_payment: "Payment Required",
  step_up_pending: "Step Up",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

/**
 * Prefer the exact selected dates/weeks snapshotted on the registration
 * itself over the generic session date-range text — the latter can
 * describe every available date/week for the session, not just the one(s)
 * this family actually picked.
 */
function getSessionDateText(row: RowData): string | null {
  if (row.rateType === "daily" && row.selectedDates && row.selectedDates.length > 0) {
    return formatSelectedDatesLabel(row.selectedDates);
  }
  if (row.rateType === "weekly" && row.selectedWeeks && row.selectedWeeks.length > 0) {
    return formatSelectedWeeksLabel(row.selectedWeeks);
  }
  return row.sessionDateRange;
}

export function RegistrationsList({ familyId, userId }: { familyId: string; userId: string }) {
  const router = useRouter();
  const { setRegistrationIds } = useRegistrationDraft();
  const [rows, setRows] = useState<RowData[] | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  async function loadCancellationRequests() {
    const requests = await cancellationService.listCancellationRequestsByFamily(familyId);
    setRequestedIds(new Set(requests.map((r) => r.registrationId)));
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const [registrations, requests] = await Promise.all([
        registrationService.listRegistrationsByFamily(familyId),
        cancellationService.listCancellationRequestsByFamily(familyId),
      ]);

      const confirmedPaymentIds = registrations
        .filter((r) => r.status === "confirmed" && r.paymentId)
        .map((r) => r.paymentId as string);
      const confirmedPayments = await paymentService.getPayments(confirmedPaymentIds);
      const referenceByPaymentId = new Map(confirmedPayments.map((p) => [p.id, p.reference]));

      const withDetails: RowData[] = registrations.map((reg) => {
        const program = programs.find((p) => p.id === reg.programId);
        return {
          ...reg,
          programName: program?.name ?? reg.programId,
          programSlug: program?.slug ?? reg.programId,
          uiState: deriveRegistrationUiState(reg),
          paymentReference: reg.paymentId ? (referenceByPaymentId.get(reg.paymentId) ?? null) : null,
        };
      });

      if (active) {
        setRows(withDetails);
        setRequestedIds(new Set(requests.map((r) => r.registrationId)));
      }
    })();
    return () => {
      active = false;
    };
  }, [familyId]);

  if (rows === null) {
    return <p className="text-sm text-muted-foreground">Loading registrations...</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">No registrations yet.</p>
        <Link
          href="/programs"
          className="mt-3 inline-flex text-sm font-semibold uppercase tracking-wide text-impact hover:underline"
        >
          Browse Programs
        </Link>
      </div>
    );
  }

  function resumePayment(registrationId: string) {
    setRegistrationIds([registrationId]);
    router.push("/register/payment");
  }

  // participantId -> { name, programId -> rows }
  const byParticipant = new Map<string, { name: string; programs: Map<string, RowData[]> }>();
  for (const row of rows) {
    const participant = byParticipant.get(row.participantId) ?? { name: row.participantName, programs: new Map() };
    const programRows = participant.programs.get(row.programId) ?? [];
    programRows.push(row);
    participant.programs.set(row.programId, programRows);
    byParticipant.set(row.participantId, participant);
  }

  return (
    <div className="space-y-6">
      {Array.from(byParticipant.entries()).map(([participantId, participant]) => (
        <div key={participantId}>
          <p className="font-heading text-lg text-navy">{participant.name}</p>
          <div className="mt-3 space-y-3">
            {Array.from(participant.programs.entries()).flatMap(([programId, programRows]) => {
              const program = programs.find((p) => p.id === programId);
              const registeredSessionIds = new Set(
                programRows.filter((r) => r.status !== "cancelled").map((r) => r.sessionId)
              );
              const hasMoreSessions = program ? program.sessions.some((s) => !registeredSessionIds.has(s.id)) : false;
              const registerLink = program
                ? `/register?program=${program.slug}&participant=${participantId === userId ? "self" : participantId}`
                : null;

              return programRows.map((row, index) => {
                const isRequested = requestedIds.has(row.id);
                const isFormOpen = openFormId === row.id;
                const isLastForProgram = index === programRows.length - 1;
                const dateText = getSessionDateText(row);
                const canRequestCancellation =
                  row.uiState === "confirmed" || row.uiState === "step_up_pending";

                return (
                  <div key={row.id} className="rounded-sm border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-navy">{program?.name ?? programId}</p>
                        <p className="mt-0.5 text-sm text-navy">
                          {row.sessionLabel}
                          {dateText && <span className="text-muted-foreground"> · {dateText}</span>}
                        </p>
                        {row.schoolLocation && (
                          <p className="text-xs text-muted-foreground">{row.schoolLocation}</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex h-7 w-fit shrink-0 items-center rounded-sm px-2.5 text-xs font-semibold uppercase tracking-wide ${STATE_BADGE_STYLES[row.uiState]}`}
                      >
                        {STATE_BADGE_LABEL[row.uiState]}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      ${row.price} · Registered {new Date(row.createdAt).toLocaleDateString()}
                      {row.uiState === "confirmed" && row.paymentReference && (
                        <> · Confirmation #{row.paymentReference}</>
                      )}
                    </p>

                    {row.uiState === "awaiting_payment" && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Your payment wasn&apos;t completed. You can finish it anytime — this
                        registration is held for you, but isn&apos;t confirmed until payment goes
                        through.
                      </p>
                    )}

                    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                      {row.uiState === "awaiting_payment" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => resumePayment(row.id)}
                          className="h-8 w-fit gap-1.5 rounded-sm bg-impact px-3 text-xs text-impact-foreground hover:bg-impact/90"
                        >
                          <CreditCard className="size-3.5" aria-hidden />
                          Complete Payment
                        </Button>
                      ) : isRequested ? (
                        <div>
                          <span className="inline-flex h-7 w-fit items-center gap-1 rounded-sm bg-amber-100 px-2.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
                            <CheckCircle2 className="size-3.5" aria-hidden />
                            Cancellation Requested
                          </span>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Your registration remains active until this request is reviewed.
                          </p>
                        </div>
                      ) : canRequestCancellation ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setOpenFormId(isFormOpen ? null : row.id)}
                          className="h-8 w-fit rounded-sm px-3 text-xs"
                        >
                          Request Cancellation
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Cancelled</span>
                      )}

                      {isLastForProgram && hasMoreSessions && registerLink && (
                        <Link
                          href={registerLink}
                          className="inline-flex h-8 w-fit items-center gap-1.5 rounded-sm bg-impact px-3 text-xs font-semibold uppercase tracking-wide text-impact-foreground transition-colors hover:bg-impact/90"
                        >
                          Register For Another Session
                          <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      )}
                    </div>

                    {isFormOpen && !isRequested && canRequestCancellation && (
                      <CancellationRequestForm
                        registrationId={row.id}
                        onCancel={() => setOpenFormId(null)}
                        onSubmitted={async () => {
                          setOpenFormId(null);
                          await loadCancellationRequests();
                        }}
                      />
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
