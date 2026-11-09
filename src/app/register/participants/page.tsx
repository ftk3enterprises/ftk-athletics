"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { ChildForm } from "@/components/profile/child-form";
import { AdultForm } from "@/components/profile/adult-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TSHIRT_SIZE_OPTIONS } from "@/data/tshirt-sizes";
import { resolveParticipant } from "@/lib/participants";
import * as profileService from "@/services/profile-service";
import type { TShirtSize } from "@/types";

function TshirtSizeSelect({
  value,
  onChange,
}: {
  value: TShirtSize | null;
  onChange: (value: TShirtSize) => void;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => v && onChange(v as TShirtSize)}>
      <SelectTrigger className="h-9 w-full text-sm sm:w-48">
        <SelectValue placeholder="Select T-shirt size">
          {(v: string | null) => TSHIRT_SIZE_OPTIONS.find((s) => s.value === v)?.label ?? ""}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TSHIRT_SIZE_OPTIONS.map((size) => (
          <SelectItem key={size.value} value={size.value}>
            {size.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ParticipantsPage() {
  const { user, family, refreshFamily } = useAuth();
  const { draft, toggleParticipant } = useRegistrationDraft();
  const router = useRouter();
  const [addingChild, setAddingChild] = useState(false);
  const [addingAdult, setAddingAdult] = useState(false);

  if (!user || !family) return null;

  async function handleAddChild(input: {
    firstName: string;
    lastName: string;
    dob: string;
    grade: string;
    school: string;
    tshirtSize: TShirtSize;
  }) {
    await profileService.addChild(family!.id, input);
    await refreshFamily();
    setAddingChild(false);
  }

  async function handleAddAdult(input: { firstName: string; lastName: string; tshirtSize: TShirtSize }) {
    await profileService.addAdult(family!.id, input);
    await refreshFamily();
    setAddingAdult(false);
  }

  const canContinue =
    draft.participantIds.length > 0 &&
    draft.participantIds.every((id) => resolveParticipant(id, user, family!)?.tshirtSize != null);

  return (
    <div className="bg-background">
      <RegistrationHeader title="Who's Registering?" step={1} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl">Select Participants</h2>
        <p className="mt-2 text-muted-foreground">
          Choose everyone who&apos;s registering this time — you can register multiple children
          and adults (or yourself) in one session. A T-shirt size is required for each person.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex w-full flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-navy sm:flex-row sm:items-center">
            <label className="flex flex-1 cursor-pointer items-center gap-4">
              <Checkbox
                checked={draft.participantIds.includes("self")}
                onCheckedChange={() => toggleParticipant("self")}
              />
              <UserRound className="size-7 text-impact" aria-hidden />
              <div>
                <p className="font-semibold text-navy">{user.name}</p>
                <p className="text-sm text-muted-foreground">Myself (parent/guardian)</p>
              </div>
            </label>
            {draft.participantIds.includes("self") && (
              <TshirtSizeSelect
                value={family.tshirtSize}
                onChange={(size) => profileService.updateFamilyTshirtSize(family!.id, size).then(refreshFamily)}
              />
            )}
          </div>

          {family.children.map((child) => (
            <div
              key={child.id}
              className="flex w-full flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-navy sm:flex-row sm:items-center"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-4">
                <Checkbox
                  checked={draft.participantIds.includes(child.id)}
                  onCheckedChange={() => toggleParticipant(child.id)}
                />
                <UserRound className="size-7 text-impact" aria-hidden />
                <div>
                  <p className="font-semibold text-navy">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{child.grade}</p>
                </div>
              </label>
              {draft.participantIds.includes(child.id) && (
                <TshirtSizeSelect
                  value={child.tshirtSize}
                  onChange={(size) =>
                    profileService.updateChild(family!.id, child.id, { tshirtSize: size }).then(refreshFamily)
                  }
                />
              )}
            </div>
          ))}

          {family.adults.map((adult) => (
            <div
              key={adult.id}
              className="flex w-full flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-navy sm:flex-row sm:items-center"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-4">
                <Checkbox
                  checked={draft.participantIds.includes(adult.id)}
                  onCheckedChange={() => toggleParticipant(adult.id)}
                />
                <UserRound className="size-7 text-impact" aria-hidden />
                <div>
                  <p className="font-semibold text-navy">
                    {adult.firstName} {adult.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">Adult</p>
                </div>
              </label>
              {draft.participantIds.includes(adult.id) && (
                <TshirtSizeSelect
                  value={adult.tshirtSize}
                  onChange={(size) =>
                    profileService.updateAdult(family!.id, adult.id, { tshirtSize: size }).then(refreshFamily)
                  }
                />
              )}
            </div>
          ))}

          {addingChild ? (
            <ChildForm onSave={handleAddChild} onCancel={() => setAddingChild(false)} />
          ) : (
            <Button
              variant="outline"
              onClick={() => setAddingChild(true)}
              className="rounded-sm border-dashed"
            >
              + Add Child
            </Button>
          )}

          {addingAdult ? (
            <AdultForm onSave={handleAddAdult} onCancel={() => setAddingAdult(false)} />
          ) : (
            <Button
              variant="outline"
              onClick={() => setAddingAdult(true)}
              className="rounded-sm border-dashed"
            >
              + Add Adult
            </Button>
          )}
        </div>

        <Button
          onClick={() => router.push("/register/programs")}
          disabled={!canContinue}
          className="mt-8 h-12 w-full rounded-sm bg-impact font-heading text-base text-impact-foreground hover:bg-impact/90 sm:w-fit sm:px-10"
        >
          Continue To Programs
        </Button>
      </div>
    </div>
  );
}
