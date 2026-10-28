"use client";

import { Check } from "lucide-react";
import { groupDatesByWeek, parseLocalDate } from "@/lib/schedule-dates";
import { calculateSessionPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { DateSelectionValue } from "@/context/registration-draft-context";
import type { ProgramSession } from "@/types";

/**
 * Reusable daily/weekly date-selection UI driven entirely by a session's
 * dateSelection config — works for any program's per-day or per-week rate,
 * not specific to any one camp. Daily mode renders bookable dates grouped
 * by calendar week (so a multi-week camp like Christmas shows its two
 * weeks separately) and flags a week as soon as it qualifies for the
 * automatic weeklyRate discount; weekly mode renders selectable week
 * cards. Both show a live unit count and computed total — always via
 * calculateSessionPrice (src/lib/pricing.ts), the single source of truth
 * for camp pricing, never a separate inline calculation.
 */
export function DateSelectionPicker({
  session,
  value,
  onChange,
}: {
  session: ProgramSession;
  value: DateSelectionValue;
  onChange: (value: DateSelectionValue) => void;
}) {
  const config = session.dateSelection;
  if (!config) return null;

  if (config.type === "daily") {
    const selected = value.dates ?? [];
    const toggle = (date: string) => {
      const next = selected.includes(date) ? selected.filter((d) => d !== date) : [...selected, date];
      onChange({ dates: next.sort() });
    };

    const weekGroups = groupDatesByWeek(config.availableDates ?? []);
    const total = calculateSessionPrice(session, { dates: selected });

    return (
      <div className="mt-3 rounded-sm border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Select Day(s)
        </p>
        <div className="mt-2.5 space-y-3">
          {weekGroups.map((weekDates) => {
            const selectedInWeek = weekDates.filter((d) => selected.includes(d));
            const weeklyRateApplied = config.weeklyRate != null && selectedInWeek.length === 5;
            return (
              <div key={weekDates[0]}>
                {weekGroups.length > 1 && (
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Week of {parseLocalDate(weekDates[0]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {weeklyRateApplied && (
                      <span className="ml-1.5 text-impact">· Weekly rate applied</span>
                    )}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {weekDates.map((date) => {
                    const isSelected = selected.includes(date);
                    const d = parseLocalDate(date);
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggle(date)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex flex-col items-center rounded-sm border px-2 py-2.5 text-center transition-colors",
                          isSelected ? "border-impact bg-impact/10" : "border-border hover:border-navy/40"
                        )}
                      >
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {isSelected && <Check className="size-3 text-impact" aria-hidden />}
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className="mt-0.5 text-sm font-semibold text-navy">
                          {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {weekGroups.length === 1 && weeklyRateApplied && (
                  <p className="mt-2 text-xs font-semibold text-impact">
                    Weekly rate applied — all 5 days this week
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">
            {selected.length} day{selected.length === 1 ? "" : "s"} selected
          </span>
          <span className="font-heading text-navy">${total}</span>
        </div>
      </div>
    );
  }

  const pricePerUnit = session.price;
  const selectedWeekIds = value.weekIds ?? [];
  const toggleWeek = (weekId: string) => {
    const next = selectedWeekIds.includes(weekId)
      ? selectedWeekIds.filter((id) => id !== weekId)
      : [...selectedWeekIds, weekId];
    onChange({ weekIds: next });
  };

  return (
    <div className="mt-3 rounded-sm border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Select Week(s)
      </p>
      <div className="mt-2.5 space-y-2">
        {(config.availableWeeks ?? []).map((week) => {
          const isSelected = selectedWeekIds.includes(week.id);
          const start = parseLocalDate(week.startDate);
          const end = parseLocalDate(week.endDate);
          return (
            <button
              key={week.id}
              type="button"
              onClick={() => toggleWeek(week.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors",
                isSelected ? "border-impact bg-impact/10" : "border-border hover:border-navy/40"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    isSelected ? "border-impact bg-impact text-impact-foreground" : "border-border"
                  )}
                >
                  {isSelected && <Check className="size-3" aria-hidden />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy">{week.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                    {end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-heading text-sm text-navy">${pricePerUnit}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">
          {selectedWeekIds.length} week{selectedWeekIds.length === 1 ? "" : "s"} selected
        </span>
        <span className="font-heading text-navy">${selectedWeekIds.length * pricePerUnit}</span>
      </div>
    </div>
  );
}
