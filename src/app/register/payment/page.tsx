"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, GraduationCap, Lock } from "lucide-react";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as registrationService from "@/services/registration-service";
import * as paymentService from "@/services/payment-service";
import type { RegistrationPaymentMethod } from "@/types";

export default function PaymentPage() {
  const { draft, setPaymentId } = useRegistrationDraft();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [total, setTotal] = useState<number | null>(null);
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
      (registrations) => {
        const sum = registrations.reduce((acc, r) => acc + (r?.price ?? 0), 0);
        setTotal(sum);
      }
    );
  }, [draft.registrationIds, router]);

  if (draft.registrationIds.length === 0 || total === null) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">Loading...</div>;
  }

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

  const count = draft.registrationIds.length;

  return (
    <div className="bg-background">
      <RegistrationHeader title="Payment" step={6} />

      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 lg:px-8">
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

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMethod("online")}
              aria-pressed={method === "online"}
              className={cn(
                "flex items-start gap-3 rounded-sm border p-4 text-left transition-colors",
                method === "online" ? "border-impact bg-impact/5" : "border-border hover:border-navy/40"
              )}
            >
              <CreditCard className="mt-0.5 size-5 shrink-0 text-impact" aria-hidden />
              <span>
                <span className="block font-heading text-sm uppercase text-navy">Pay Online</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Pay securely online.</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("step_up")}
              aria-pressed={method === "step_up"}
              className={cn(
                "flex items-start gap-3 rounded-sm border p-4 text-left transition-colors",
                method === "step_up" ? "border-impact bg-impact/5" : "border-border hover:border-navy/40"
              )}
            >
              <GraduationCap className="mt-0.5 size-5 shrink-0 text-impact" aria-hidden />
              <span>
                <span className="block font-heading text-sm uppercase text-navy">
                  Use Step Up For Students
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Use eligible Step Up scholarship funds.
                </span>
              </span>
            </button>
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
