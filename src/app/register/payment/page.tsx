"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, CreditCard, GraduationCap, Lock } from "lucide-react";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { programs } from "@/data/programs";
import { STEP_UP_PAYMENT_ENABLED } from "@/data/config";
import * as registrationService from "@/services/registration-service";
import * as paymentService from "@/services/payment-service";
import type { Registration, RegistrationPaymentMethod } from "@/types";

export default function PaymentPage() {
  const { draft, setPaymentId } = useRegistrationDraft();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("canceled") ? "Checkout was canceled. You can try again below." : null
  );
  const [method, setMethod] = useState<RegistrationPaymentMethod>("online");

  useEffect(() => {
    if (draft.registrationIds.length === 0) {
      router.replace("/register/review");
      return;
    }
    Promise.all(draft.registrationIds.map((id) => registrationService.getRegistration(id))).then(
      (regs) => setRegistrations(regs.filter((r): r is Registration => r !== null))
    );
  }, [draft.registrationIds, router]);

  if (draft.registrationIds.length === 0 || registrations === null) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">Loading...</div>;
  }

  const total = registrations.reduce((sum, r) => sum + r.price, 0);
  // Only offered when every registration in this pass belongs to a program
  // flagged cashPaymentEligible (currently the camps) — never shown for any
  // other program, so this never changes behavior elsewhere.
  const cashEligible =
    registrations.length > 0 &&
    registrations.every((r) => programs.find((p) => p.id === r.programId)?.cashPaymentEligible);

  async function handlePay() {
    setIsPaying(true);
    setError(null);
    try {
      const { paymentId, url } = await paymentService.createCheckoutSession({
        registrationIds: draft.registrationIds,
      });
      setPaymentId(paymentId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setIsPaying(false);
    }
  }

  async function handleStepUp() {
    if (!STEP_UP_PAYMENT_ENABLED) return;
    setIsPaying(true);
    setError(null);
    try {
      await Promise.all(
        draft.registrationIds.map((id) =>
          registrationService.setRegistrationPaymentMethod(id, "step_up")
        )
      );
      router.push("/register/confirmation");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPaying(false);
    }
  }

  async function handleCash() {
    setIsPaying(true);
    setError(null);
    try {
      await Promise.all(
        draft.registrationIds.map((id) => registrationService.setRegistrationPaymentMethod(id, "cash"))
      );
      router.push("/register/confirmation");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPaying(false);
    }
  }

  const count = draft.registrationIds.length;

  return (
    <div className="bg-background">
      <RegistrationHeader title="Payment" step={6} />

      <div className={cn("mx-auto px-4 py-14 sm:px-6 lg:px-8", cashEligible ? "max-w-2xl" : "max-w-xl")}>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          Secure Checkout
        </div>

        <div className="mt-4 rounded-sm border border-border bg-card p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm text-muted-foreground">
              {count} registration{count === 1 ? "" : "s"}
            </span>
            <span className="text-2xl text-navy">${total}</span>
          </div>

          <div className={cn("mt-5 grid grid-cols-1 gap-3", cashEligible ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            <button
              type="button"
              onClick={() => setMethod("online")}
              aria-pressed={method === "online"}
              className={cn(
                "flex h-full flex-col items-center gap-2 rounded-sm border p-4 text-center transition-colors",
                method === "online" ? "border-impact bg-impact/5" : "border-border hover:border-navy/40"
              )}
            >
              <CreditCard className="size-5 shrink-0 text-impact" aria-hidden />
              <span className="font-heading text-xs uppercase leading-snug text-navy sm:text-sm">
                Credit/Debit Card
              </span>
              <span className="text-xs leading-snug text-muted-foreground">Pay securely online.</span>
            </button>
            <button
              type="button"
              onClick={() => STEP_UP_PAYMENT_ENABLED && setMethod("step_up")}
              disabled={!STEP_UP_PAYMENT_ENABLED}
              aria-pressed={method === "step_up"}
              aria-disabled={!STEP_UP_PAYMENT_ENABLED}
              className={cn(
                "relative flex h-full flex-col items-center gap-2 rounded-sm border p-4 text-center transition-colors",
                method === "step_up" ? "border-impact bg-impact/5" : "border-border hover:border-navy/40",
                !STEP_UP_PAYMENT_ENABLED && "cursor-not-allowed opacity-60 hover:border-border"
              )}
            >
              {!STEP_UP_PAYMENT_ENABLED && (
                <span className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Coming Soon
                </span>
              )}
              <GraduationCap className="size-5 shrink-0 text-impact" aria-hidden />
              <span className="font-heading text-xs uppercase leading-snug text-navy sm:text-sm">
                Step Up For Students
              </span>
              <span className="text-xs leading-snug text-muted-foreground">
                Use eligible scholarship funds.
              </span>
            </button>
            {cashEligible && (
              <button
                type="button"
                onClick={() => setMethod("cash")}
                aria-pressed={method === "cash"}
                className={cn(
                  "flex h-full flex-col items-center gap-2 rounded-sm border p-4 text-center transition-colors",
                  method === "cash" ? "border-impact bg-impact/5" : "border-border hover:border-navy/40"
                )}
              >
                <Banknote className="size-5 shrink-0 text-impact" aria-hidden />
                <span className="font-heading text-xs uppercase leading-snug text-navy sm:text-sm">Cash</span>
                <span className="text-xs leading-snug text-muted-foreground">
                  Pay in person on the first day.
                </span>
              </button>
            )}
          </div>

          {method === "online" ? (
            <>
              <div className="mt-5 rounded-sm border border-border bg-muted/40 p-4 text-sm leading-relaxed text-navy">
                You&apos;ll be taken to Stripe&apos;s secure checkout to pay by card, Apple Pay, or
                Google Pay. Card details are entered there — never collected or stored by this
                site.
              </div>

              {error && <p className="mt-4 text-sm text-impact">{error}</p>}

              <Button
                onClick={handlePay}
                disabled={isPaying}
                className="mt-6 h-12 w-full rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90"
              >
                {isPaying ? "Redirecting To Checkout..." : `Pay $${total} Now`}
              </Button>
            </>
          ) : method === "cash" ? (
            <>
              <div className="mt-5 rounded-sm border border-impact/30 bg-impact/5 p-4 text-sm leading-relaxed text-navy">
                <strong>Please bring the full cash payment (${total}) for all selected camp days on
                your first day of camp.</strong> Submitting here does not charge anything now — FTK
                will mark it received once your cash payment is collected on-site.
              </div>

              {error && <p className="mt-4 text-sm text-impact">{error}</p>}

              <Button
                onClick={handleCash}
                disabled={isPaying}
                className="mt-6 h-12 w-full rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90"
              >
                {isPaying ? "Submitting..." : "Submit Registration"}
              </Button>
            </>
          ) : (
            <>
              <div className="mt-5 rounded-sm border border-border bg-muted/40 p-4 text-sm leading-relaxed text-navy">
                Choose this option if you plan to use Step Up For Students scholarship funds for
                this registration. Submitting here does not charge a card — Step Up funding is
                applied through the official Step Up For Students site, separate from this
                registration.
              </div>

              {error && <p className="mt-4 text-sm text-impact">{error}</p>}

              <Button
                onClick={handleStepUp}
                disabled={isPaying}
                className="mt-6 h-12 w-full rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90"
              >
                {isPaying ? "Submitting..." : "Submit Registration"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
