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
import { ADULT_TSHIRT_SIZE_OPTIONS } from "@/data/tshirt-sizes";
import type { FamilyAdult, TShirtSize } from "@/types";

type AdultInput = {
  firstName: string;
  lastName: string;
  tshirtSize: TShirtSize;
};

export function AdultForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Pick<FamilyAdult, "firstName" | "lastName" | "tshirtSize">;
  onSave: (input: AdultInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tshirtSize, setTshirtSize] = useState<TShirtSize | "">(initial?.tshirtSize ?? "");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tshirtSize) return;
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    await onSave({
      firstName: String(data.get("firstName") ?? ""),
      lastName: String(data.get("lastName") ?? ""),
      tshirtSize,
    });
    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-sm border border-border bg-muted/40 p-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="adultFirstName">First Name</Label>
        <Input id="adultFirstName" name="firstName" defaultValue={initial?.firstName} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="adultLastName">Last Name</Label>
        <Input id="adultLastName" name="lastName" defaultValue={initial?.lastName} required />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="adultTshirtSize">T-Shirt Size</Label>
        <Select value={tshirtSize} onValueChange={(value) => setTshirtSize((value as TShirtSize) ?? "")}>
          <SelectTrigger id="adultTshirtSize" className="h-10 w-full">
            <SelectValue placeholder="Select a T-shirt size">
              {(value: string | null) => ADULT_TSHIRT_SIZE_OPTIONS.find((s) => s.value === value)?.label ?? ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ADULT_TSHIRT_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button
          type="submit"
          disabled={isSubmitting || !tshirtSize}
          className="rounded-sm bg-navy font-heading hover:bg-navy/90"
        >
          {isSubmitting ? "Saving..." : "Save Adult"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}
