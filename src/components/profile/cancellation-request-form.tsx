"use client";

import { useState, type FormEvent } from "react";
import { CreditCard, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import * as cancellationService from "@/services/cancellation-service";
import type { CancellationResolution } from "@/types";

export function CancellationRequestForm({
  registrationId,
  onCancel,
  onSubmitted,
}: {
  registrationId: string;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [resolution, setResolution] = useState<CancellationResolution>("credit");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { alreadyRequested } = await cancellationService.submitCancellationRequest({
        registrationId,
        preferredResolution: resolution,
        reason: reason.trim(),
      });
      if (alreadyRequested) {
        setError("A cancellation request has already been submitted for this registration.");
        setIsSubmitting(false);
        return;
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-4 rounded-sm border border-border bg-muted/30 p-4"
    >
      <div className="space-y-1.5">
        <Label>Preferred Resolution</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setResolution("credit")}
            aria-pressed={resolution === "credit"}
            className={cn(
              "flex items-center gap-2.5 rounded-sm border p-3 text-left text-sm transition-colors",
              resolution === "credit" ? "border-impact bg-impact/5" : "border-border hover:border-navy/40"
            )}
          >
            <HandCoins className="size-4 shrink-0 text-impact" aria-hidden />
            Credit Toward Future Program
          </button>
          <button
            type="button"
            onClick={() => setResolution("refund")}
            aria-pressed={resolution === "refund"}
            className={cn(
              "flex items-center gap-2.5 rounded-sm border p-3 text-left text-sm transition-colors",
              resolution === "refund" ? "border-impact bg-impact/5" : "border-border hover:border-navy/40"
            )}
          >
            <CreditCard className="size-4 shrink-0 text-impact" aria-hidden />
            Refund
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`reason-${registrationId}`}>Reason For Cancellation</Label>
        <Textarea
          id={`reason-${registrationId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          rows={3}
          placeholder="Let us know why you're requesting a cancellation"
        />
      </div>

      {error && <p className="text-sm text-impact">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={isSubmitting || !reason.trim()}
          className="h-10 rounded-sm bg-impact font-heading text-sm text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-6"
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10 rounded-sm sm:w-fit sm:px-6"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
