"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PAYMENT_STATUS_OPTIONS,
  REQUEST_OPTIONS,
  countActiveFilters,
  type AdminFilterSelections,
} from "@/lib/admin-filters";

interface FilterCheckboxGroupProps {
  title: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onSelectAll: () => void;
}

function FilterCheckboxGroup({
  title,
  allLabel,
  options,
  selected,
  onToggle,
  onSelectAll,
}: FilterCheckboxGroupProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold uppercase tracking-wide text-navy">{title}</legend>
      <div className="mt-3 flex flex-col gap-3">
        <label className="flex items-center gap-2.5 text-sm text-foreground">
          <Checkbox checked={selected.length === 0} onCheckedChange={onSelectAll} />
          {allLabel}
        </label>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={selected.includes(opt.value)}
              onCheckedChange={() => onToggle(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface MobileFilterSheetProps {
  programOptions: string[];
  filters: AdminFilterSelections;
  onApply: (next: AdminFilterSelections) => void;
}

/**
 * Full-screen mobile filter panel. Edits happen on a local `draft` copy —
 * nothing reaches the table until "Apply Filters" is tapped. Closing the
 * panel any other way (X button, swipe/backdrop, Escape) just discards the
 * draft, since it was never applied; reopening resets the draft back to
 * whatever filters are currently live.
 */
export function MobileFilterSheet({ programOptions, filters, onApply }: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AdminFilterSelections>(filters);
  const activeCount = countActiveFilters(filters);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(filters);
    setOpen(next);
  }

  function toggleIn(group: keyof AdminFilterSelections, value: string) {
    setDraft((prev) => {
      const current = prev[group] as string[];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [group]: next } as AdminFilterSelections;
    });
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : "Filters"}
        className="relative inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-sm border border-input bg-background text-sm font-semibold uppercase tracking-wide text-navy"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {activeCount > 0 && (
          <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-impact text-[11px] font-bold text-impact-foreground">
            {activeCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-none gap-0 rounded-none border-none p-0 sm:hidden"
      >
        <div className="flex h-full flex-col bg-background pt-[env(safe-area-inset-top)]">
          <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-border p-4">
            <SheetTitle className="text-lg text-navy">Filters</SheetTitle>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setDraft({ programs: [], paymentStatuses: [], requests: [] })}
                className="text-sm font-semibold text-impact"
              >
                Clear All
              </button>
              <SheetClose
                aria-label="Close filters"
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" aria-hidden />
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-7 overflow-y-auto p-4">
            <FilterCheckboxGroup
              title="Programs"
              allLabel="All Programs"
              options={programOptions.map((name) => ({ value: name, label: name }))}
              selected={draft.programs}
              onToggle={(v) => toggleIn("programs", v)}
              onSelectAll={() => setDraft((prev) => ({ ...prev, programs: [] }))}
            />
            <FilterCheckboxGroup
              title="Payment Status"
              allLabel="All Payment Statuses"
              options={PAYMENT_STATUS_OPTIONS}
              selected={draft.paymentStatuses}
              onToggle={(v) => toggleIn("paymentStatuses", v)}
              onSelectAll={() => setDraft((prev) => ({ ...prev, paymentStatuses: [] }))}
            />
            <FilterCheckboxGroup
              title="Requests"
              allLabel="All Requests"
              options={REQUEST_OPTIONS}
              selected={draft.requests}
              onToggle={(v) => toggleIn("requests", v)}
              onSelectAll={() => setDraft((prev) => ({ ...prev, requests: [] }))}
            />
          </div>

          <SheetFooter className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleApply}
              className="h-11 w-full rounded-sm bg-impact font-heading text-sm uppercase tracking-wide text-impact-foreground transition-colors hover:bg-impact/90"
            >
              Apply Filters
            </button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
