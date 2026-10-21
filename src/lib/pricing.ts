import type { Program, ProgramSession, ProgramWeek } from "@/types";

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

export interface DateSelectionInput {
  dates?: string[];
  weekIds?: string[];
}

/**
 * The authoritative price for one session given a parent's date/week picks.
 * Sessions without a dateSelection (leagues, after-school, any flat-rate
 * session) are already priced per-registration via session.price. Sessions
 * with a dateSelection (camps) are priced per unit × units selected.
 */
export function calculateSessionPrice(
  session: ProgramSession,
  selection: DateSelectionInput | undefined
): number {
  if (!session.dateSelection) return session.price;
  if (session.dateSelection.type === "daily") {
    return session.price * (selection?.dates?.length ?? 0);
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
    const { unitPrice, unitLabel, units, unitsLabel, periodLabel } = program.priceBreakdown;
    return {
      headline: `$${unitPrice * units} / ${periodLabel}`,
      sublabel: `$${unitPrice}/${unitLabel} × ${units} ${unitsLabel}s`,
    };
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
