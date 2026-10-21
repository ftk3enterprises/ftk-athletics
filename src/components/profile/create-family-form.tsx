"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/auth-context";
import { programs } from "@/data/programs";

export function CreateFamilyForm({ redirectTo }: { redirectTo?: string }) {
  const { ensureFamily } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interestedProgramIds, setInterestedProgramIds] = useState<string[]>([]);

  function toggleProgram(programId: string, checked: boolean) {
    setInterestedProgramIds((prev) =>
      checked ? [...prev, programId] : prev.filter((id) => id !== programId)
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    await ensureFamily({ phone: String(data.get("phone") ?? ""), interestedProgramIds });
    setIsSubmitting(false);
    if (redirectTo) router.push(redirectTo);
  }

  return (
    <div className="mx-auto max-w-lg rounded-sm border border-border bg-card p-6 sm:p-8">
      <h2 className="text-2xl">Finish Setting Up Your Family</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        One more detail and your family profile is ready — you&apos;ll be able to add children
        and register for programs.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" type="tel" required />
        </div>

        <div className="space-y-2">
          <Label>Programs You&apos;re Interested In</Label>
          <p className="text-xs text-muted-foreground">
            Optional — helps us point you to the right registrations.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {programs.map((program) => (
              <label
                key={program.id}
                className="flex items-center gap-2.5 rounded-sm border border-border px-3 py-2.5 text-sm"
              >
                <Checkbox
                  checked={interestedProgramIds.includes(program.id)}
                  onCheckedChange={(checked) => toggleProgram(program.id, checked === true)}
                />
                {program.name}
              </label>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-sm bg-impact font-heading text-impact-foreground hover:bg-impact/90"
        >
          {isSubmitting ? "Saving..." : "Create Family Profile"}
        </Button>
      </form>
    </div>
  );
}
