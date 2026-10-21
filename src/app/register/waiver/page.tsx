"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { programs } from "@/data/programs";
import { LIABILITY_WAIVER_TEXT } from "@/data/config";
import * as waiverService from "@/services/waiver-service";

export default function WaiverPage() {
  const { user, family, refreshFamily } = useAuth();
  const { draft } = useRegistrationDraft();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (draft.participantIds.length === 0) router.replace("/register/participants");
    else if (draft.programIds.length === 0) router.replace("/register/programs");
  }, [draft.participantIds.length, draft.programIds.length, router]);

  const participantNames = useMemo(() => {
    if (!user || !family) return [];
    return draft.participantIds.map((id) =>
      id === "self" ? user.name : family.children.find((c) => c.id === id)?.firstName ?? "Participant"
    );
  }, [draft.participantIds, user, family]);

  const programNames = useMemo(
    () => draft.programIds.map((id) => programs.find((p) => p.id === id)?.name ?? "Program"),
    [draft.programIds]
  );

  if (!user || !family || draft.participantIds.length === 0 || draft.programIds.length === 0) return null;

  async function goToReview() {
    router.push("/register/review");
  }

  async function handleSign() {
    setBusy(true);
    await waiverService.acceptWaiver({
      familyId: family!.id,
      userId: user!.id,
      participantIds: draft.participantIds.map((id) => (id === "self" ? user!.id : id)),
      programIds: draft.programIds,
      signatureName: signature.trim(),
    });
    await refreshFamily();
    setBusy(false);
    await goToReview();
  }

  if (family.waiver.accepted) {
    return (
      <div className="bg-background">
        <RegistrationHeader title="Liability Waiver" step={5} />
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 rounded-sm border border-carolina/40 bg-carolina/10 p-5">
            <CheckCircle2 className="size-6 shrink-0 text-carolina" aria-hidden />
            <p className="text-navy">
              Your family already accepted the FTK liability waiver
              {family.waiver.acceptedAt &&
                ` on ${new Date(family.waiver.acceptedAt).toLocaleDateString()}`}
              . It covers {participantNames.join(", ")} for {programNames.join(", ")}.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => router.push("/register/details")}
              className="h-12 rounded-sm sm:w-fit sm:px-8"
            >
              Back
            </Button>
            <Button
              onClick={goToReview}
              className="h-12 rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-10"
            >
              Continue To Review
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canContinue = agreed && signature.trim().length > 1;

  return (
    <div className="bg-background">
      <RegistrationHeader title="Liability Waiver" step={5} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl">Review &amp; Sign</h2>
        <p className="mt-2 text-muted-foreground">
          This waiver applies once to your family account and will cover every participant and
          program selected below.
        </p>

        <div className="mt-5 rounded-sm border border-border bg-muted/40 p-4 text-sm">
          <p className="font-semibold uppercase tracking-wide text-impact">Participants</p>
          <p className="mt-1 text-navy">{participantNames.join(", ")}</p>
          <p className="mt-3 font-semibold uppercase tracking-wide text-impact">Programs</p>
          <p className="mt-1 text-navy">{programNames.join(", ")}</p>
        </div>

        <div className="mt-6 max-h-96 overflow-y-auto whitespace-pre-line rounded-sm border border-border bg-background p-5 text-sm leading-relaxed text-muted-foreground">
          {LIABILITY_WAIVER_TEXT}
        </div>

        <label className="mt-5 flex items-start gap-3">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <span className="text-sm text-navy">
            I have read and agree to the Liability Waiver and Release for the participants and
            programs selected above.
          </span>
        </label>

        <div className="mt-5 max-w-sm space-y-1.5">
          <Label htmlFor="signature">Parent/Guardian Signature</Label>
          <Input
            id="signature"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full legal name"
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/register/details")}
            className="h-12 rounded-sm sm:w-fit sm:px-8"
          >
            Back
          </Button>
          <Button
            onClick={handleSign}
            disabled={!canContinue || busy}
            className="h-12 rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-10"
          >
            {busy ? "Saving..." : "Accept & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
