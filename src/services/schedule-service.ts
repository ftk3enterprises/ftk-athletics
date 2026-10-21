import { scheduleEvents } from "@/data/schedule";
import type { ScheduleEvent } from "@/types";
import { networkDelay } from "@/lib/storage";

export async function listScheduleEvents(): Promise<ScheduleEvent[]> {
  await networkDelay(150);
  return scheduleEvents;
}
