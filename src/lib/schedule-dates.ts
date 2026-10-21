import type { ProgramWeek, ScheduleEvent } from "@/types";

/**
 * Non-color label for a league event's phase — shown alongside (never
 * instead of) the category color/icon. Kept in this plain module (not the
 * "use client" schedule-calendar.tsx) so the server-rendered schedule list
 * page can import it too — a "use client" file's non-component exports
 * don't cross the server/client boundary reliably.
 */
export const EVENT_TYPE_LABELS: Record<NonNullable<ScheduleEvent["eventType"]>, string> = {
  "regular-season": "Regular Season",
  tournament: "Tournament",
};

/** Parses an ISO "YYYY-MM-DD" date as a local-time Date (avoids UTC day-shift bugs). */
export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** All calendar dates an event should render on (inclusive range, one entry for single-day events). */
export function eventDateRange(event: ScheduleEvent): Date[] {
  const start = parseLocalDate(event.startDate);
  const end = parseLocalDate(event.endDate);
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatEventTimeRange(event: ScheduleEvent): string | null {
  const start = formatTime(event.startTime);
  const end = formatTime(event.endTime);
  if (!start) return null;
  return end ? `${start} – ${end}` : start;
}

export function formatEventDateRange(event: ScheduleEvent): string {
  const start = parseLocalDate(event.startDate);
  const end = parseLocalDate(event.endDate);
  const startLabel = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (isSameDay(start, end)) return startLabel;
  const endLabel = end.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Weeks (Sun–Sat) covering a month, padded with adjacent-month days so every week is full. */
export function getMonthGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const lastOfMonth = new Date(year, month + 1, 0);
  const endOffset = 6 - lastOfMonth.getDay();
  const gridEnd = new Date(year, month + 1, lastOfMonth.getDate() + endOffset);

  const weeks: Date[][] = [];
  let week: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    week.push(new Date(cursor));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return weeks;
}

/** "Dec 21, 22 & 23, 2026" for a set of selected individual dates (daily rate). */
export function formatSelectedDatesLabel(dates: string[]): string {
  if (dates.length === 0) return "";
  const sorted = [...dates].sort();
  const parsed = sorted.map(parseLocalDate);
  const month = parsed[0].toLocaleDateString("en-US", { month: "short" });
  const sameMonth = parsed.every((d) => d.getMonth() === parsed[0].getMonth() && d.getFullYear() === parsed[0].getFullYear());
  const year = parsed[0].getFullYear();

  if (sameMonth) {
    const days = parsed.map((d) => d.getDate());
    const dayList =
      days.length === 1
        ? `${days[0]}`
        : `${days.slice(0, -1).join(", ")} & ${days[days.length - 1]}`;
    return `${month} ${dayList}, ${year}`;
  }

  // Spans multiple months (e.g. a Christmas Camp selection crossing into January) — list each date in full.
  return parsed
    .map((d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
    .join(", ");
}

/** "Week 2: Dec 28 – 31, 2026" (single week) or "Week 1 (Dec 21–24) & Week 2 (Dec 28–31)" (multiple). */
export function formatSelectedWeeksLabel(weeks: ProgramWeek[]): string {
  if (weeks.length === 0) return "";
  const formatRange = (week: ProgramWeek) => {
    const start = parseLocalDate(week.startDate);
    const end = parseLocalDate(week.endDate);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };
  if (weeks.length === 1) {
    return `${weeks[0].label}: ${formatRange(weeks[0])}`;
  }
  return weeks.map((week) => `${week.label} (${formatRange(week)})`).join(" & ");
}
