import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { scheduleEvents } from "@/data/schedule";
import { getProgramBySlug, programs } from "@/data/programs";
import {
  EVENT_TYPE_LABELS,
  formatEventDateRange,
  formatEventTimeRange,
  formatMonthLabel,
  parseLocalDate,
  toLocalIso,
} from "@/lib/schedule-dates";
import type { ScheduleEvent } from "@/types";

export const metadata: Metadata = {
  title: "Schedule | For The Kids Athletics",
};

function groupUpcomingByMonth(events: ScheduleEvent[]) {
  const todayIso = toLocalIso(new Date());
  const upcoming = events
    .filter((event) => event.endDate >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const groups = new Map<string, { label: string; events: ScheduleEvent[] }>();
  for (const event of upcoming) {
    const date = parseLocalDate(event.startDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = formatMonthLabel(date.getFullYear(), date.getMonth());
    const group = groups.get(key) ?? { label, events: [] };
    group.events.push(event);
    groups.set(key, group);
  }
  return Array.from(groups.values());
}

export default function SchedulePage() {
  const monthGroups = groupUpcomingByMonth(scheduleEvents);

  return (
    <div className="bg-background">
      <div className="bg-navy py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-carolina">
            Plan Your Season
          </p>
          <h1 className="mt-2 text-4xl text-white sm:text-5xl">Schedule</h1>
          <p className="mt-4 max-w-xl text-white/70">
            A quick look at every upcoming FTK clinic, camp, league, and event.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <ScheduleCalendar events={scheduleEvents} />

        <div className="mt-16 space-y-12">
          {monthGroups.map((group) => (
            <div key={group.label}>
              <h2 className="text-xl uppercase tracking-wide text-impact">{group.label}</h2>
              <div className="mt-4 divide-y divide-border rounded-sm border border-border">
                {group.events.map((event) => {
                  const program = event.programId
                    ? (programs.find((p) => p.id === event.programId) ??
                      getProgramBySlug(event.programId))
                    : null;
                  const timeRange = formatEventTimeRange(event);
                  return (
                    <div
                      key={event.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-lg">{event.title}</h3>
                          <StatusBadge status={event.status} />
                          {event.eventType && (
                            <span className="rounded-sm border border-navy/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                              {EVENT_TYPE_LABELS[event.eventType]}
                            </span>
                          )}
                          {event.isDemoDate && (
                            <span className="rounded-sm bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Tentative
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-navy">
                          {formatEventDateRange(event)}
                          {timeRange ? ` · ${timeRange}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {event.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="size-3.5" aria-hidden />
                              {event.location}
                            </span>
                          )}
                          {program?.ageRange && (
                            <span className="flex items-center gap-1.5">
                              <Users className="size-3.5" aria-hidden />
                              {program.ageRange}
                            </span>
                          )}
                        </div>
                      </div>

                      {program ? (
                        <Link
                          href={
                            event.registrationOpen
                              ? `/register?program=${program.slug}`
                              : `/programs/${program.slug}`
                          }
                          className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-sm bg-navy px-5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-navy/90 sm:w-40"
                        >
                          {event.registrationOpen ? "Register" : "View Program"}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Details Coming Soon</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
