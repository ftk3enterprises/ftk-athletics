"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { CreateFamilyForm } from "@/components/profile/create-family-form";
import { ChildrenManager } from "@/components/profile/children-manager";
import { RegistrationsList } from "@/components/profile/registrations-list";
import { WaiverReviewForm } from "@/components/profile/waiver-review-form";
import { Button } from "@/components/ui/button";
import { programs } from "@/data/programs";

export function ProfileClient({ redirectTo }: { redirectTo?: string }) {
  const { user, family, isLoading, refreshFamily } = useAuth();
  const router = useRouter();
  const [isReviewingWaiver, setIsReviewingWaiver] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      const target = redirectTo ? `/profile?redirect=${encodeURIComponent(redirectTo)}` : "/profile";
      router.replace(`/auth?redirect=${encodeURIComponent(target)}`);
    }
  }, [isLoading, user, router, redirectTo]);

  if (isLoading || !user) {
    return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-muted-foreground">Loading...</div>;
  }

  if (!family) {
    return (
      <div className="bg-background px-4 py-16 sm:px-6 lg:px-8">
        <CreateFamilyForm redirectTo={redirectTo} />
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="bg-navy py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-carolina">My Profile</p>
          <h1 className="mt-1.5 break-words text-4xl text-white sm:text-5xl">{family.parentName}</h1>
          <div className="mt-2.5 flex flex-col gap-1 text-sm text-white/70 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:text-base">
            <span className="break-all">{family.email}</span>
            <span className="hidden sm:inline">·</span>
            <span>{family.phone}</span>
          </div>
          {family.interestedProgramIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {family.interestedProgramIds.map((id) => {
                const program = programs.find((p) => p.id === id);
                if (!program) return null;
                return (
                  <span
                    key={id}
                    className="rounded-sm bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-carolina"
                  >
                    {program.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-14 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-2xl">Liability Waiver</h2>
          <div className="mt-4 rounded-sm border border-border p-5">
            {family.waiver.accepted ? (
              <div className="flex items-center gap-2.5 text-navy">
                <CheckCircle2 className="size-5 text-carolina" aria-hidden />
                <span className="font-medium">
                  Accepted
                  {family.waiver.acceptedAt &&
                    ` on ${new Date(family.waiver.acceptedAt).toLocaleDateString()}`}{" "}
                  (v{family.waiver.version})
                </span>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5 text-navy">
                    <ShieldAlert className="size-5 text-impact" aria-hidden />
                    <span className="font-medium">Not yet accepted</span>
                  </div>
                  {!isReviewingWaiver && (
                    <Button
                      onClick={() => setIsReviewingWaiver(true)}
                      className="rounded-sm bg-navy font-heading hover:bg-navy/90"
                    >
                      Review & Accept Waiver
                    </Button>
                  )}
                </div>
                {isReviewingWaiver && (
                  <WaiverReviewForm
                    familyId={family.id}
                    userId={user.id}
                    childIds={family.children.map((c) => c.id)}
                    onCancel={() => setIsReviewingWaiver(false)}
                    onAccepted={async () => {
                      setIsReviewingWaiver(false);
                      await refreshFamily();
                    }}
                  />
                )}
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl">Children</h2>
          <div className="mt-4">
            <ChildrenManager
              familyId={family.id}
              familyChildren={family.children}
              onChanged={refreshFamily}
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl">My Registrations</h2>
          <div className="mt-4">
            <RegistrationsList familyId={family.id} userId={user.id} />
          </div>
        </section>
      </div>
    </div>
  );
}
