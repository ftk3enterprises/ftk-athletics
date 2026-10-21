"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChildForm } from "@/components/profile/child-form";
import * as profileService from "@/services/profile-service";
import type { Child } from "@/types";

export function ChildrenManager({
  familyId,
  familyChildren: initialChildren,
  onChanged,
}: {
  familyId: string;
  familyChildren: Child[];
  onChanged: () => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd(input: {
    firstName: string;
    lastName: string;
    dob: string;
    grade: string;
    school: string;
  }) {
    await profileService.addChild(familyId, input);
    await onChanged();
    setAdding(false);
  }

  async function handleEdit(
    childId: string,
    input: { firstName: string; lastName: string; dob: string; grade: string; school: string }
  ) {
    await profileService.updateChild(familyId, childId, input);
    await onChanged();
    setEditingId(null);
  }

  async function handleRemove(childId: string) {
    await profileService.removeChild(familyId, childId);
    await onChanged();
    setRemovingId(null);
  }

  return (
    <div className="space-y-4">
      {initialChildren.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          No children added yet. Add a child to register them for youth programs.
        </p>
      )}

      {initialChildren.map((child) =>
        editingId === child.id ? (
          <ChildForm
            key={child.id}
            initial={child}
            onSave={(input) => handleEdit(child.id, input)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={child.id}
            className="flex items-center justify-between gap-3 rounded-sm border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <UserRound className="size-5 text-impact" aria-hidden />
              <div>
                <p className="font-semibold text-navy">
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {child.grade}
                  {child.school ? ` · ${child.school}` : ""} · DOB {child.dob}
                </p>
              </div>
            </div>

            {removingId === child.id ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Remove child?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-sm"
                  onClick={() => handleRemove(child.id)}
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
                  aria-label={`Edit ${child.firstName}`}
                  onClick={() => setEditingId(child.id)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${child.firstName}`}
                  onClick={() => setRemovingId(child.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )
      )}

      {adding ? (
        <ChildForm onSave={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <Button
          variant="outline"
          onClick={() => setAdding(true)}
          className="rounded-sm border-dashed"
        >
          <Plus className="size-4" />
          Add Child
        </Button>
      )}
    </div>
  );
}
