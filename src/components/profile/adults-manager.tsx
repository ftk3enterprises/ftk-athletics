"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdultForm } from "@/components/profile/adult-form";
import * as profileService from "@/services/profile-service";
import { getTshirtSizeLabel } from "@/data/tshirt-sizes";
import type { FamilyAdult, TShirtSize } from "@/types";

export function AdultsManager({
  familyId,
  familyAdults: initialAdults,
  onChanged,
}: {
  familyId: string;
  familyAdults: FamilyAdult[];
  onChanged: () => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd(input: { firstName: string; lastName: string; tshirtSize: TShirtSize }) {
    await profileService.addAdult(familyId, input);
    await onChanged();
    setAdding(false);
  }

  async function handleEdit(
    adultId: string,
    input: { firstName: string; lastName: string; tshirtSize: TShirtSize }
  ) {
    await profileService.updateAdult(familyId, adultId, input);
    await onChanged();
    setEditingId(null);
  }

  async function handleRemove(adultId: string) {
    await profileService.removeAdult(familyId, adultId);
    await onChanged();
    setRemovingId(null);
  }

  return (
    <div className="space-y-4">
      {initialAdults.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          No additional adults added yet. Add an adult to register them for adult leagues or family events.
        </p>
      )}

      {initialAdults.map((adult) =>
        editingId === adult.id ? (
          <AdultForm
            key={adult.id}
            initial={adult}
            onSave={(input) => handleEdit(adult.id, input)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={adult.id}
            className="flex items-center justify-between gap-3 rounded-sm border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <UserRound className="size-5 text-impact" aria-hidden />
              <div>
                <p className="font-semibold text-navy">
                  {adult.firstName} {adult.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{getTshirtSizeLabel(adult.tshirtSize)}</p>
              </div>
            </div>

            {removingId === adult.id ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Remove adult?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-sm"
                  onClick={() => handleRemove(adult.id)}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-sm"
                  onClick={() => setRemovingId(null)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Edit ${adult.firstName}`}
                  onClick={() => setEditingId(adult.id)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${adult.firstName}`}
                  onClick={() => setRemovingId(adult.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )
      )}

      {adding ? (
        <AdultForm onSave={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <Button
          variant="outline"
          onClick={() => setAdding(true)}
          className="rounded-sm border-dashed"
        >
          <Plus className="size-4" />
          Add Adult
        </Button>
      )}
    </div>
  );
}
