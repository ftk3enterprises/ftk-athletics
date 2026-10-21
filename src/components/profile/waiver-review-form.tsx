"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LIABILITY_WAIVER_TEXT } from "@/data/config";
import * as waiverService from "@/services/waiver-service";

export function WaiverReviewForm({
  familyId,
  userId,
  childIds,
  onCancel,
  onAccepted,
}: {
  familyId: string;
  userId: string;
  childIds: string[];
  onCancel: () => void;
  onAccepted: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = agreed && signature.trim().length > 1;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await waiverService.acceptWaiver({
        familyId,
        userId,
        participantIds: [userId, ...childIds],
        programIds: [],
        signatureName: signature.trim(),
      });
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-4 rounded-sm border border-border bg-muted/30 p-4">
      <div className="max-h-72 overflow-y-auto whitespace-pre-line rounded-sm border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground">
        {LIABILITY_WAIVER_TEXT}
      </div>

      <label className="flex items-start gap-3">
        <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
        <span className="text-sm text-navy">
          I have read and agree to the Liability Waiver and Release above.
        </span>
      </label>

      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="profile-waiver-signature">Parent/Guardian Signature</Label>
        <Input
          id="profile-waiver-signature"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Type your full legal name"
        />
      </div>

      {error && <p className="text-sm text-impact">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="h-10 rounded-sm bg-impact font-heading text-sm text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-6"
        >
          {isSubmitting ? "Saving..." : "Accept Waiver"}
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
