"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flag,
  Gift,
  MapPin,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProgramBySlug, programs } from "@/data/programs";
import { getCategoryForProgram } from "@/data/program-categories";
import {
  EVENT_TYPE_LABELS,
  eventDateRange,
  formatEventDateRange,
  formatEventTimeRange,
  formatMonthLabel,
  getMonthGrid,
  isSameDay,
  toLocalIso,
} from "@/lib/schedule-dates";
import type { ScheduleEvent } from "@/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * One color per program category so the calendar is scannable at a glance.
 * Keyed by ProgramCategory.id (src/data/program-categories.ts) — add a new
 * category there and a matching entry here to give it its own color; any
 * event without a known category (or with no programId) falls back to
 * FALLBACK_STYLE.
 */
const CATEGORY_STYLES: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; dot: string; bg: string; text: string; hoverBg: string }
> = {
  "after-school-program": {
    label: "After School Program",
    icon: Zap,
    dot: "bg-amber-500",
    bg: "bg-amber-500",
    text: "text-white",
    hoverBg: "hover:bg-amber-600",
  },
  camps: {
    label: "Camps",
    icon: Gift,
    dot: "bg-emerald-600",
    bg: "bg-emerald-600",
    text: "text-white",
    hoverBg: "hover:bg-emerald-700",
  },
  "youth-leagues": {
    label: "Youth Leagues",
    icon: Trophy,
    dot: "bg-violet-600",
    bg: "bg-violet-600",
    text: "text-white",
    hoverBg: "hover:bg-violet-700",
  },
  "adult-leagues": {
    label: "Adult Leagues",
    icon: Users,
    dot: "bg-sky-600",
    bg: "bg-sky-600",
    text: "text-white",
    hoverBg: "hover:bg-sky-700",
  },
};

const FALLBACK_STYLE = {
  label: "Other",
  icon: Flag,
  dot: "bg-muted-foreground/60",
  bg: "bg-muted",
  text: "text-muted-foreground",
  hoverBg: "hover:bg-muted/70",
};

function styleForEvent(event: ScheduleEvent) {
  if (!event.programId) return FALLBACK_STYLE;
  const category = getCategoryForProgram(event.programId);
  return (category && CATEGORY_STYLES[category.id]) || FALLBACK_STYLE;
}

export function ScheduleCalendar({ events }: { events: ScheduleEvent[] }) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const event of events) {
      for (const date of eventDateRange(event)) {
        const key = toLocalIso(date);
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
      }
    }
    return map;
  }, [events]);

  const weeks = useMemo(
    () => getMonthGrid(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  );

  const selectedProgram = selectedEvent?.programId ? getProgramBySlug(selectedEvent.programId) ?? programs.find((p) => p.id === selectedEvent.programId) : null;

  function goToMonth(offset: number) {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function goToday() {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-navy px-4 py-3 sm:px-6">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="group flex items-center gap-3 text-white"
        >
          <h2 className="text-xl sm:text-2xl">
            {formatMonthLabel(visibleMonth.getFullYear(), visibleMonth.getMonth())}
          </h2>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-white/30 transition-colors group-hover:bg-white/10">
            <ChevronDown
              className={`size-5 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              aria-hidden
            />
          </span>
          <span className="sr-only">{isOpen ? "Collapse calendar" : "Expand calendar"}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="rounded-sm border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
          >
            Today
          </button>
          <button
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-sm border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="flex size-8 items-center justify-center rounded-sm border border-white/20 text-white transition-colors hover:bg-white/10"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border bg-muted/20 px-4 py-2.5 sm:px-6">
            {Object.values(CATEGORY_STYLES).map((style) => (
              <span key={style.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-2.5 rounded-full ${style.dot}`} aria-hidden />
                {style.label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
            ))}
          </div>

          <div className="divide-y divide-border">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 divide-x divide-border">
                {week.map((date) => {
                  const inMonth = date.getMonth() === visibleMonth.getMonth();
                  const dayEvents = eventsByDate.get(toLocalIso(date)) ?? [];
                  const isToday = isSameDay(date, today);
                  return (
                    <div
                      key={date.toISOString()}
                      className={`min-h-[60px] p-1 sm:min-h-[78px] sm:p-1.5 ${inMonth ? "bg-background" : "bg-muted/20"}`}
                    >
                      <span
                        className={`inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isToday
                            ? "bg-impact text-impact-foreground"
                            : inMonth
                              ? "text-navy"
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => {
                          const style = styleForEvent(event);
                          const Icon = style.icon;
                          return (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className={`flex w-full items-center gap-1 rounded-sm px-1 py-0.5 text-left text-[10px] font-semibold leading-tight transition-colors sm:text-xs ${style.bg} ${style.text} ${style.hoverBg} ${
                                event.registrationOpen ? "" : "opacity-60"
                              }`}
                            >
                              <Icon className="size-3 shrink-0" aria-hidden />
                              <span className="truncate">{event.title}</span>
                            </button>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <p className="px-1 text-[10px] font-medium text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedEvent.status} />
                  {selectedEvent.eventType && (
                    <span className="rounded-sm border border-navy/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                      {EVENT_TYPE_LABELS[selectedEvent.eventType]}
                    </span>
                  )}
                  {selectedEvent.isDemoDate && (
                    <span className="rounded-sm bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Tentative
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span className={`size-2.5 rounded-full ${styleForEvent(selectedEvent).dot}`} aria-hidden />
                    {styleForEvent(selectedEvent).label}
                  </span>
                </div>
                <DialogTitle className="font-heading text-2xl normal-case text-navy">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>

              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-navy">
                  <span className="font-medium">{formatEventDateRange(selectedEvent)}</span>
                </div>
                {formatEventTimeRange(selectedEvent) && (
                  <div className="text-muted-foreground">{formatEventTimeRange(selectedEvent)}</div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {selectedEvent.location}
                  </div>
                )}
                {selectedProgram?.ageRange && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5 shrink-0" aria-hidden />
                    {selectedProgram.ageRange}
                  </div>
                )}
              </dl>

              <DialogFooter className="sm:justify-start">
                {selectedProgram ? (
                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/programs/${selectedProgram.slug}`}
                      className="flex h-10 flex-1 items-center justify-center rounded-sm border border-navy text-sm font-semibold uppercase tracking-wide text-navy transition-colors hover:bg-navy/5"
                    >
                      View Program
                    </Link>
                    {selectedEvent.registrationOpen && (
                      <Link
                        href={`/register?program=${selectedProgram.slug}`}
                        className="flex h-10 flex-1 items-center justify-center rounded-sm bg-impact text-sm font-semibold uppercase tracking-wide text-impact-foreground transition-colors hover:bg-impact/90"
                      >
                        Register
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Details Coming Soon</p>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
