"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRegistrationDraft } from "@/context/registration-draft-context";
import { RegistrationHeader } from "@/components/registration/registration-header";
import { ChildForm } from "@/components/profile/child-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import * as profileService from "@/services/profile-service";

export default function ParticipantsPage() {
  const { user, family, refreshFamily } = useAuth();
  const { draft, toggleParticipant } = useRegistrationDraft();
  const router = useRouter();
  const [addingChild, setAddingChild] = useState(false);

  if (!user || !family) return null;

  async function handleAddChild(input: {
    firstName: string;
    lastName: string;
    dob: string;
    grade: string;
    school: string;
  }) {
    await profileService.addChild(family!.id, input);
    await refreshFamily();
    setAddingChild(false);
  }

  const canContinue = draft.participantIds.length > 0;

  return (
    <div className="bg-background">
      <RegistrationHeader title="Who's Registering?" step={1} />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl">Select Participants</h2>
        <p className="mt-2 text-muted-foreground">
          Choose everyone who&apos;s registering this time — you can register multiple children
          (or yourself) in one session.
        </p>

        <div className="mt-6 space-y-3">
          <label className="flex w-full cursor-pointer items-center gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-navy">
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

          {family.children.map((child) => (
            <label
              key={child.id}
              className="flex w-full cursor-pointer items-center gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-navy"
            >
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
