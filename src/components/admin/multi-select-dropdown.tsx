"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MultiSelectDropdownProps {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

/** Desktop filter control: a Select-style trigger that opens a checkbox menu, so several values can be picked without the menu closing after each click. */
export function MultiSelectDropdown({
  label,
  allLabel,
  options,
  selected,
  onChange,
  className,
}: MultiSelectDropdownProps) {
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const triggerLabel = selected.length === 0 ? allLabel : `${label} (${selected.length})`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Filter by ${label.toLowerCase()}`}
        className={cn(
          "inline-flex h-9 w-full items-center justify-between gap-2 rounded-sm border border-input bg-background px-3 text-sm text-foreground outline-none data-popup-open:ring-2 data-popup-open:ring-ring/50 sm:w-auto",
          className
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuCheckboxItem checked={selected.length === 0} onCheckedChange={() => onChange([])}>
          {allLabel}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => toggle(opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
