"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OTHER_SCHOOL_VALUE, SCHOOL_SELECT_OPTIONS } from "@/data/schools";
import type { Child } from "@/types";

type ChildInput = {
  firstName: string;
  lastName: string;
  dob: string;
  grade: string;
  school: string;
};

/** The stored school is either a known label, a custom "other" name, or empty — resolve which Select option (if any) should show as active. */
function schoolSelectCode(storedSchool: string | undefined): string {
  if (!storedSchool) return "";
  const known = SCHOOL_SELECT_OPTIONS.some(
    (s) => s.value !== OTHER_SCHOOL_VALUE && s.label === storedSchool
  );
  return known ? (SCHOOL_SELECT_OPTIONS.find((s) => s.label === storedSchool)?.value ?? "") : OTHER_SCHOOL_VALUE;
}

export function ChildForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Pick<Child, "firstName" | "lastName" | "dob" | "grade" | "school">;
  onSave: (input: ChildInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Preserves an existing custom "other" school name when editing — only
  // reset by the parent explicitly choosing a different known school.
  const [selectCode, setSelectCode] = useState(() => schoolSelectCode(initial?.school));
  const [customSchool, setCustomSchool] = useState(() =>
    selectCode === OTHER_SCHOOL_VALUE ? initial?.school ?? "" : ""
  );

  const resolvedSchool =
    selectCode === OTHER_SCHOOL_VALUE
      ? customSchool
      : SCHOOL_SELECT_OPTIONS.find((s) => s.value === selectCode)?.label ?? "";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    await onSave({
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      dob: String(data.get("dob") ?? ""),
      grade: String(data.get("grade") ?? ""),
      school: resolvedSchool,
    });
    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-sm border border-border bg-muted/40 p-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="firstName">First Name</Label>
        <Input id="firstName" name="firstName" defaultValue={initial?.firstName} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lastName">Last Name</Label>
        <Input id="lastName" name="lastName" defaultValue={initial?.lastName} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input id="dob" name="dob" type="date" defaultValue={initial?.dob} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="grade">Grade</Label>
        <Input id="grade" name="grade" placeholder="e.g. 3rd Grade" defaultValue={initial?.grade} required />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="school">Current School</Label>
        <Select value={selectCode} onValueChange={(value) => setSelectCode(value ?? "")}>
          <SelectTrigger id="school" className="h-10 w-full">
            <SelectValue placeholder="Select your child's current school">
              {(value: string | null) => SCHOOL_SELECT_OPTIONS.find((s) => s.value === value)?.label ?? ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SCHOOL_SELECT_OPTIONS.map((school) => (
              <SelectItem key={school.value} value={school.value}>
                {school.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectCode === OTHER_SCHOOL_VALUE && (
          <Input
            placeholder="Enter school name"
            value={customSchool}
            onChange={(e) => setCustomSchool(e.target.value)}
            required
            className="mt-1.5"
          />
        )}
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button
          type="submit"
          disabled={isSubmitting || !resolvedSchool}
          className="rounded-sm bg-navy font-heading hover:bg-navy/90"
        >
          {isSubmitting ? "Saving..." : "Save Child"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}
