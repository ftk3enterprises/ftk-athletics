import type { Program, ProgramSession, ProgramWeek } from "@/types";
import { groupDatesByWeek } from "@/lib/schedule-dates";

/**
 * The single source of truth for FTK pricing. Both the UI (price displays,
 * live totals during registration) and the server (price validation in
 * src/app/api/registrations/route.ts, src/app/api/checkout/route.ts) import
 * from here — nothing else hardcodes a dollar amount. Programs/sessions
 * stay code (src/data/programs.ts), not database rows, so this file is the
 * actual "pricing config."
 */

export const LEAGUE_PRICE_PER_REGISTRATION = 200;

/** Youth/Adult Kickball only — the client's latest official flyers set this league's price at $175, independent of LEAGUE_PRICE_PER_REGISTRATION above (which other leagues still use). */
export const KICKBALL_PRICE_PER_REGISTRATION = 175;

export const AFTER_SCHOOL_DAILY_RATE = 30;
export const AFTER_SCHOOL_WEEKS_PER_SESSION = 4;
export const AFTER_SCHOOL_SESSION_PRICE = AFTER_SCHOOL_DAILY_RATE * AFTER_SCHOOL_WEEKS_PER_SESSION;

export const CAMP_DAILY_RATE = 60;
export const CAMP_WEEKLY_RATE = 250;

/** Per the client-provided Nerf Battle flyer: $30 per person. */
export const NERF_BATTLE_PRICE_PER_PERSON = 30;

export interface DateSelectionInput {
  dates?: string[];
  weekIds?: string[];
}

/**
 * The authoritative price for one session given a parent's date/week picks.
 * Sessions without a dateSelection (leagues, after-school, any flat-rate
 * session) are already priced per-registration via session.price. Sessions
 * with a dateSelection (camps) are priced per unit × units selected.
 *
 * Daily-type sessions with a configured `weeklyRate` (camps) get an
 * automatic bulk discount: selected dates are grouped by calendar week
 * (Monday-anchored), and any week where exactly 5 dates were selected is
 * charged the flat weeklyRate instead of 5 × the daily rate. A week with
 * fewer selected dates (including camps whose week has fewer than 5
 * operating days to begin with, e.g. a holiday-shortened week) is always
 * priced per day — it can never reach the 5-date threshold. Multi-week
 * selections (e.g. Christmas Camp spanning two separate weeks) are priced
 * per week and summed.
 */
export function calculateSessionPrice(
  session: ProgramSession,
  selection: DateSelectionInput | undefined
): number {
  if (!session.dateSelection) return session.price;
  if (session.dateSelection.type === "daily") {
    const dates = selection?.dates ?? [];
    const weeklyRate = session.dateSelection.weeklyRate;
    if (!weeklyRate) return session.price * dates.length;
    return groupDatesByWeek(dates).reduce(
      (total, week) => total + (week.length === 5 ? weeklyRate : session.price * week.length),
      0
    );
  }
  return session.price * (selection?.weekIds?.length ?? 0);
}

/** Resolves selected week ids to their full ProgramWeek objects, for snapshotting onto the registration at purchase time. */
export function resolveSelectedWeeks(
  session: ProgramSession,
  weekIds: string[] | undefined
): ProgramWeek[] {
  const available = session.dateSelection?.availableWeeks ?? [];
  return (weekIds ?? [])
    .map((id) => available.find((w) => w.id === id))
    .filter((w): w is ProgramWeek => Boolean(w));
}

/** Headline + optional sublabel for a program's price, shown on cards and detail pages. */
export function formatProgramPriceDisplay(program: Program): {
  headline: string;
  sublabel: string | null;
} {
  if (program.priceBreakdown) {
    const { unitPrice, units, periodLabel } = program.priceBreakdown;
    return {
      headline: `$${unitPrice * units}`,
      sublabel: `/ ${periodLabel}`,
    };
  }

  // A single daily-rate session with a bulk weeklyRate (camps) — show the
  // same "$X – $Y" range a separate daily/weekly session pair used to
  // produce, even though it's now one session with an automatic discount.
  if (program.sessions.length === 1) {
    const [session] = program.sessions;
    if (session.dateSelection?.type === "daily" && session.dateSelection.weeklyRate) {
      return {
        headline: `$${session.price} – $${session.dateSelection.weeklyRate}`,
        sublabel: "Daily or weekly rate",
      };
    }
  }

  const sessionPrices = Array.from(new Set(program.sessions.map((s) => s.price)));
  if (sessionPrices.length > 1) {
    const sorted = [...sessionPrices].sort((a, b) => a - b);
    return {
      headline: `$${sorted[0]} – $${sorted[sorted.length - 1]}`,
      sublabel: "Daily or weekly rate",
    };
  }

  if (program.price == null) return { headline: "Pricing Coming Soon", sublabel: null };
  return {
    headline: `$${program.price}`,
    sublabel: program.category === "League" ? "per registration" : null,
  };
}
