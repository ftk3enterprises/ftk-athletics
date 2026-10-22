export interface LeagueFlyer {
  id: string;
  /** Small label above the title — org or category, e.g. "Suncoast Flag Football" or "FTK Athletics". */
  eyebrow: string;
  /** Event title shown prominently on the card, e.g. "Winter League 2026" or "Youth Kickball League". */
  title: string;
  /** One short, factual line of context (age range, day, location). The flyer image itself carries full detail — keep this brief. */
  supportingText: string;
  flyerSrc: string;
  flyerAlt: string;
  /** Natural pixel dimensions of the flyer image — renders the card and lightbox at the flyer's true aspect ratio instead of a fixed one. */
  flyerWidth: number;
  flyerHeight: number;
  /**
   * Optional call-to-action. Omit entirely (rather than pointing at an
   * unconfirmed destination) when there's nothing solid to send people to
   * yet — see the dated comments below for programs still pending
   * client confirmation.
   */
  cta?: {
    label: string;
    href: string;
    /** True for links that leave the site — opens in a new tab with rel="noopener". */
    external?: boolean;
  };
  /**
   * Set to false to archive a flyer without deleting its record — e.g. once
   * its dates have passed. Defaults to true (shown) when omitted.
   */
  active?: boolean;
}

/**
 * Add a new entry here to publish another flyer in the homepage
 * "Leagues & Community Events" section — no component changes needed.
 * Only `active` (or active-by-default) entries render; flip `active: false`
 * on an entry to pull it without losing its data.
 */
export const FLYERS: LeagueFlyer[] = [
  {
    id: "ftk-youth-kickball-inaugural",
    eyebrow: "FTK Athletics",
    title: "Youth Kickball League",
    supportingText: "Ages 4–12 · Saturdays · Turner Park at Skye Ranch",
    flyerSrc: "/about/ftk-youth-kickball-league-flyer.jpg",
    flyerAlt:
      "FTK Youth Kickball League, Inaugural Season flyer — ages 4-6, 7-9, and 10-12, Saturday games at Turner Park at Skye Ranch",
    flyerWidth: 768,
    flyerHeight: 1024,
    // This flyer is the authoritative source for both pricing ($175/player,
    // src/lib/pricing.ts KICKBALL_PRICE_PER_REGISTRATION) and the Dec 5 –
    // Jan 16 schedule (src/data/schedule.ts, src/data/programs.ts) — an
    // earlier season-schedule email had different dates; the client
    // confirmed the flyer is correct.
    cta: { label: "Register Now", href: "/register?program=youth-kickball" },
    active: true,
  },
  {
    id: "ftk-adult-kickball-inaugural",
    eyebrow: "FTK Athletics",
    title: "Adult Kickball League",
    supportingText: "Ages 18+ · Sundays · Turner Park at Skye Ranch",
    flyerSrc: "/about/ftk-adult-kickball-league-flyer.jpg",
    flyerAlt:
      "FTK Adult Kickball League, Inaugural Season flyer — ages 18+, Sunday games at Turner Park at Skye Ranch",
    flyerWidth: 768,
    flyerHeight: 1024,
    // Same resolution as Youth Kickball above: this flyer is authoritative
    // for pricing ($175/player) and the Dec 6 – Jan 17 schedule.
    cta: { label: "Register Now", href: "/register?program=adult-kickball" },
    active: true,
  },
  {
    id: "suncoast-flag-football-winter-2026",
    eyebrow: "Suncoast Flag Football",
    title: "Winter League 2026",
    supportingText: "Ages 5–14 · Friday nights at Evie's Golf Center",
    flyerSrc: "/about/winter-suncoast-flag-football-flyer-2026.jpg",
    flyerAlt:
      "Suncoast Flag Football Winter League 2026 flyer — Friday nights at Evie's Golf Center",
    flyerWidth: 1091,
    flyerHeight: 1441,
    cta: { label: "Visit Website", href: "https://suncoastflagfootball.com", external: true },
    // This flyer lists "First games: Friday, January 8" for "Winter League
    // 2026" — flag for the client to confirm whether that date has already
    // passed (and this should be archived) or the league is still running.
    active: true,
  },
];

export const ACTIVE_FLYERS: LeagueFlyer[] = FLYERS.filter((flyer) => flyer.active !== false);
