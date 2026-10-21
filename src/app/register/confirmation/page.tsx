"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { programs } from "@/data/programs";
import { STEP_UP_URL } from "@/data/config";
import * as registrationService from "@/services/registration-service";
import * as paymentService from "@/services/payment-service";
import type { Payment, Registration } from "@/types";

export default function ConfirmationPage() {
  const { draft, reset } = useRegistrationDraft();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  // Set right before reset()+push() in handleNavigate so the empty-draft
  // redirect below doesn't win the race against the intended navigation.
  const navigatingAwayRef = useRef(false);

  // Stripe redirects here with ?payment=<id> after a real checkout — more
  // reliable than draft.paymentId, which depends on a localStorage write
  // racing the hard navigation to Stripe's hosted page.
  const paymentId = searchParams.get("payment") ?? draft.paymentId;

  useEffect(() => {
    if (navigatingAwayRef.current) return;
    if (draft.registrationIds.length === 0) {
      router.replace("/register/participants");
      return;
    }
    Promise.all(draft.registrationIds.map((id) => registrationService.getRegistration(id))).then(
      (regs) => setRegistrations(regs.filter((r): r is Registration => r !== null))
    );
    if (paymentId) {
      paymentService.getPayment(paymentId).then(setPayment);
    }
  }, [draft.registrationIds, paymentId, router]);

  if (!registrations || draft.registrationIds.length === 0) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">Loading...</div>;
  }

  const grouped = new Map<
    string,
    {
      participantName: string;
      lines: {
        key: string;
        programName: string;
        sessionLabel: string;
        sessionDateRange: string | null;
        schoolLocation: string | null;
        price: number;
      }[];
    }
  >();
  for (const reg of registrations) {
    const program = programs.find((p) => p.id === reg.programId);
    const group = grouped.get(reg.participantId) ?? { participantName: reg.participantName, lines: [] };
    group.lines.push({
      key: reg.id,
      programName: program?.name ?? reg.programId,
      sessionLabel: reg.sessionLabel,
      sessionDateRange: reg.sessionDateRange,
      schoolLocation: reg.schoolLocation,
      price: reg.price,
    });
    grouped.set(reg.participantId, group);
  }
  const total = registrations.reduce((sum, r) => sum + r.price, 0);
  const isStepUp = registrations.every((r) => r.paymentMethod === "step_up");

  function handleNavigate(path: string) {
    navigatingAwayRef.current = true;
    reset();
    router.push(path);
  }

  return (
    <div className="bg-background">
      <div className="bg-navy py-16 text-center sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <CheckCircle2 className="mx-auto size-16 text-carolina" aria-hidden />
          {isStepUp ? (
            <>
              <h1 className="mt-5 text-4xl text-white sm:text-5xl">Registration Submitted</h1>
              <p className="mt-3 text-white/70">
                {registrations.length} registration{registrations.length === 1 ? "" : "s"} saved for
                Step Up For Students.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-5 text-4xl text-white sm:text-5xl">Registration Confirmed</h1>
              <p className="mt-3 text-white/70">
                {registrations.length} registration{registrations.length === 1 ? "" : "s"} complete.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {Array.from(grouped.values()).map((group) => (
            <div key={group.participantName} className="rounded-sm border border-border">
              <div className="border-b border-border bg-muted/40 px-5 py-3">
                <p className="font-heading text-lg text-navy">{group.participantName}</p>
              </div>
              <div className="divide-y divide-border">
                {group.lines.map((line) => (
                  <div
                    key={line.key}
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
                    </span>
                    <span className="font-medium text-navy">${line.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {isStepUp ? (
          <div className="mt-6 rounded-sm border border-border bg-muted/40 p-5 text-sm leading-relaxed text-navy">
            <p>
              Your registration has been saved with <strong>Step Up For Students</strong> selected
              as the payment method. Step Up funding is handled directly through the official Step
              Up For Students site, separate from this registration — continue there to apply your
              scholarship funds.
            </p>
            <a
              href={STEP_UP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-heading text-sm uppercase text-impact transition-colors hover:text-impact/80"
            >
              Continue To Step Up For Students
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
        ) : (
          <dl className="mt-6 divide-y divide-border rounded-sm border border-border">
            <div className="flex items-center justify-between p-4">
              <dt className="text-sm text-muted-foreground">Amount Paid</dt>
              <dd className="font-medium text-navy">${total}</dd>
            </div>
            {payment && (
              <div className="flex items-center justify-between p-4">
                <dt className="text-sm text-muted-foreground">Confirmation #</dt>
                <dd className="font-medium text-navy">{payment.reference}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => handleNavigate("/profile")}
            className="flex h-12 flex-1 items-center justify-center rounded-sm bg-navy font-heading text-base text-white transition-colors hover:bg-navy/90"
          >
            View My Profile
          </button>
          <button
            onClick={() => handleNavigate("/profile")}
            className="flex h-12 flex-1 items-center justify-center rounded-sm border border-navy font-heading text-base text-navy transition-colors hover:bg-muted"
          >
            View My Programs
          </button>
        </div>
      </div>
    </div>
  );
}
