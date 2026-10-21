"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { programs } from "@/data/programs";
import { formatProgramPriceDisplay } from "@/lib/pricing";

export default function ProgramsPage() {
  const { draft, toggleProgram } = useRegistrationDraft();
  const router = useRouter();

  useEffect(() => {
    if (draft.participantIds.length === 0) router.replace("/register/participants");
  }, [draft.participantIds.length, router]);

  if (draft.participantIds.length === 0) return null;

  const canContinue = draft.programIds.length > 0;

  return (
    <div className="bg-background">
      <RegistrationHeader title="Which Programs?" step={2} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl">Select Programs</h2>
        <p className="mt-2 text-muted-foreground">
          Pick one or more programs. You&apos;ll assign specific participants to each program
          next.
        </p>

        <div className="mt-6 space-y-3">
          {programs.map((program) => {
            const disabled = !program.registrationOpen;
            const checked = draft.programIds.includes(program.id);
            const price = formatProgramPriceDisplay(program);
            return (
              <label
                key={program.id}
                className={`flex w-full items-center gap-4 rounded-sm border p-5 transition-colors ${
                  disabled
                    ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                    : "cursor-pointer border-border bg-card hover:border-navy"
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => !disabled && toggleProgram(program.id)}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-semibold text-navy">{program.name}</p>
                    <StatusBadge status={program.registrationStatus} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{program.shortDescription}</p>
                </div>
                {program.price != null && (
                  <span className="shrink-0 text-right">
                    <span className="block font-heading text-lg text-navy">{price.headline}</span>
                    {price.sublabel && (
                      <span className="block text-xs text-muted-foreground">{price.sublabel}</span>
                    )}
                  </span>
                )}
              </label>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => router.push("/register/participants")}
            className="h-12 rounded-sm sm:w-fit sm:px-8"
          >
            Back
          </Button>
          <Button
            onClick={() => router.push("/register/schedule")}
            disabled={!canContinue}
            className="h-12 rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-10"
          >
            Continue To Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
