import type { Program } from "@/types";
import {
  AFTER_SCHOOL_DAILY_RATE,
  AFTER_SCHOOL_SESSION_PRICE,
  AFTER_SCHOOL_WEEKS_PER_SESSION,
  CAMP_DAILY_RATE,
  CAMP_WEEKLY_RATE,
  KICKBALL_PRICE_PER_REGISTRATION,
  LEAGUE_PRICE_PER_REGISTRATION,
} from "@/lib/pricing";
import { SCHOOLS } from "@/data/schools";

/** Turner Park at Skye Ranch Baseball Fields — shared home venue for both Kickball leagues' inaugural season. */
const KICKBALL_LOCATION = "Turner Park at Skye Ranch Baseball Fields, 185 Little Dipper Lane, Sarasota, FL 34241";

/**
 * Placeholder After School session per school — one weekday each, so
 * registration is fully working end-to-end before FTK confirms real days.
 * Each only needs its `classDates` swapped for the real four dates once
 * confirmed (keep them four Mondays/Tuesdays/etc. in a row) — nothing else
 * about the program or registration flow needs to change. Spread across
 * Mon–Fri so no two schools compete for the same weekday, and placed after
 * Thanksgiving week (Nov 23–27) and before Winter Break (starts Dec 21) so
 * they don't collide with the camp calendar.
 */
const AFTER_SCHOOL_PLACEHOLDER_SESSIONS: Record<string, { weekday: string; classDates: string[] }> = {
  "skye-ranch": { weekday: "Mondays", classDates: ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-30"] },
  "lakeview-elementary": { weekday: "Tuesdays", classDates: ["2026-11-03", "2026-11-10", "2026-11-17", "2026-12-01"] },
  "brentwood-elementary": { weekday: "Wednesdays", classDates: ["2026-11-04", "2026-11-11", "2026-11-18", "2026-12-02"] },
  "phillippi-shores-elementary": { weekday: "Thursdays", classDates: ["2026-11-05", "2026-11-12", "2026-11-19", "2026-12-03"] },
  "ashton-elementary": { weekday: "Fridays", classDates: ["2026-11-06", "2026-11-13", "2026-11-20", "2026-12-04"] },
};

/**
 * Centralized program data — the single source of truth for program cards
 * (home + /programs), program detail pages, the registration flow, the
 * schedule calendar/list (via programId on ScheduleEvent, see
 * src/data/schedule.ts), parent registration history, and the admin table.
 * Change a program's price, schedule, or registrationStatus/registrationOpen
 * here and every view picks it up automatically — no other file needs to
 * change.
 *
 * Fields ending in *IsDemo flag figures the client hasn't finalized yet
 * (still shown to users, just not guaranteed final) — see priceIsDemo/
 * capacityIsDemo usage in src/app/programs/[slug]/page.tsx.
 *
 * registrationStatus/registrationOpen is the reusable Active <-> Coming Soon
 * switch (see StatusBadge + ProgramCard) — set a program to
 * registrationStatus: "coming-soon", registrationOpen: false to pull it out
 * of registration without touching any component.
 */
export const programs: Program[] = [
  {
    id: "after-school-clinic",
    slug: "after-school-clinic",
    name: "After School Clinic",
    category: "Clinic",
    participantType: "youth",
    shortDescription:
      "Athletic performance, sport conditioning, movement, and organized play after the final bell.",
    fullDescription:
      "Our After School Clinic gives kids organized, coach-led athletic activity right after class lets out — no pickup juggling required. Each session builds fundamental movement and sport skills across a rotation of activities in a supportive, high-energy environment.",
    image:
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=1600&auto=format&fit=crop",
    location: null,
    // Parents pick their school site during registration (see src/data/schools.ts)
    // rather than this program having one fixed location.
    requiresSchoolSelection: true,
    // Browsed/selected via the dedicated school-calendar picker
    // (AfterSchoolScheduleBlock) instead of the generic session list — see
    // sessions below, grouped by schoolId.
    schoolBasedSessions: true,
    scheduleDisplay:
      "3:30 – 4:30 PM · One day per week, varies by school · 4-week sessions (dates below are placeholders pending FTK's confirmed weekday per school)",
    startDate: null,
    endDate: null,
    ageRange: "Grades K-5",
    gradeRange: "K-5",
    price: AFTER_SCHOOL_SESSION_PRICE,
    priceIsDemo: false,
    priceBreakdown: {
      unitPrice: AFTER_SCHOOL_DAILY_RATE,
      unitLabel: "day",
      units: AFTER_SCHOOL_WEEKS_PER_SESSION,
      unitsLabel: "week",
      periodLabel: "4-week session",
    },
    capacity: 20,
    capacityIsDemo: true,
    spotsRemaining: 14,
    // The program itself is active — every school is always selectable —
    // even though no school currently has a confirmed 4-week session (see
    // sessions below). "Coming Soon" describes a program, not these school
    // locations, so this stays "open" rather than gating the whole program.
    registrationStatus: "open",
    registrationOpen: true,
    featured: true,
    stepUpEligible: true,
    // One school's 4-week session at a time — a parent buys the current
    // session and can come back from My Profile to purchase the next one
    // once it's scheduled.
    sessionSelectionMode: "single",
    // Placeholder dates (see AFTER_SCHOOL_PLACEHOLDER_SESSIONS above) so
    // registration is fully working right now — swap in the real four
    // dates per school once FTK confirms them; everything else (pricing,
    // validation, My Registrations, admin) already works unchanged. A
    // session only becomes selectable once it has exactly four classDates
    // (enforced server-side in /api/registrations too), so pulling a
    // school back out to "no sessions scheduled" is just emptying its
    // classDates array.
    sessions: SCHOOLS.map((school) => {
      const placeholder = AFTER_SCHOOL_PLACEHOLDER_SESSIONS[school.value];
      const firstDate = placeholder.classDates[0];
      const lastDate = placeholder.classDates[placeholder.classDates.length - 1];
      return {
        id: `after-school-${school.value}-2026-11`,
        programId: "after-school-clinic",
        label: school.label,
        dateRange: `${placeholder.weekday}, Nov – Dec 2026 (dates subject to change)`,
        startDate: firstDate,
        endDate: lastDate,
        price: AFTER_SCHOOL_SESSION_PRICE,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
        schoolId: school.value,
        classDates: placeholder.classDates,
      };
    }),
  },
  {
    id: "thanksgiving-camp",
    slug: "thanksgiving-camp",
    name: "Thanksgiving Camp",
    category: "Camp",
    participantType: "youth",
    shortDescription:
      "A full day of games, challenges, and coached sport sessions over Thanksgiving week.",
    fullDescription:
      "When school's out for Thanksgiving, FTK is in. Thanksgiving Camp keeps kids active and engaged with a full day of games, challenges, and coached sport sessions. Choose a single day or save with the full-week rate.",
    image: "/about/end-of-camp.jpeg",
    location: null,
    requiresSchoolSelection: false,
    scheduleDisplay: "Nov 23–27, 2026 (Thanksgiving Break week) · Exact operating days TBD",
    startDate: "2026-11-23",
    endDate: "2026-11-27",
    ageRange: "Grades K-6",
    gradeRange: "K-6",
    price: CAMP_DAILY_RATE,
    priceIsDemo: false,
    capacity: 30,
    capacityIsDemo: true,
    spotsRemaining: 30,
    registrationStatus: "open",
    registrationOpen: true,
    featured: true,
    stepUpEligible: true,
    // A parent picks one pricing path per registration pass — daily rate or
    // the full-week rate — not a combination of both.
    sessionSelectionMode: "single",
    sessions: [
      {
        id: "thanksgiving-camp-daily",
        programId: "thanksgiving-camp",
        label: "Daily Rate",
        dateRange: "Nov 23–27, 2026 · Pick any day(s)",
        startDate: "2026-11-23",
        endDate: "2026-11-27",
        price: CAMP_DAILY_RATE,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
        // Thanksgiving Day itself (Nov 26) is excluded as an operating day
        // — the rest of the week's exact operating days are still pending
        // client confirmation (see scheduleDisplay above).
        dateSelection: {
          type: "daily",
          availableDates: ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-27"],
        },
      },
      {
        id: "thanksgiving-camp-weekly",
        programId: "thanksgiving-camp",
        label: "Weekly Rate",
        dateRange: "Nov 23–27, 2026 (full week)",
        startDate: "2026-11-23",
        endDate: "2026-11-27",
        price: CAMP_WEEKLY_RATE,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
        dateSelection: {
          type: "weekly",
          availableWeeks: [
            {
              id: "thanksgiving-week",
              label: "Thanksgiving Break Week",
              startDate: "2026-11-23",
              endDate: "2026-11-27",
            },
          ],
        },
      },
    ],
  },
  {
    id: "christmas-camps",
    slug: "christmas-camps",
    name: "Christmas Camps",
    category: "Camp",
    participantType: "youth",
    shortDescription:
      "A full day of games, challenges, and coached sport sessions over Christmas Break.",
    fullDescription:
      "When school lets out for Christmas Break, FTK is in. Christmas Camps keep kids active and engaged with a full day of games, challenges, and coached sport sessions. Choose a single day or save with the full-week rate.",
    image: "/about/kids-zone-camp.jpeg",
    location: null,
    requiresSchoolSelection: false,
    scheduleDisplay: "Dec 21, 2026 – Jan 1, 2027 (Winter Break, two weeks) · Exact operating days TBD",
    startDate: "2026-12-21",
    endDate: "2027-01-01",
    ageRange: "Grades K-6",
    gradeRange: "K-6",
    price: CAMP_DAILY_RATE,
    priceIsDemo: false,
    capacity: 30,
    capacityIsDemo: true,
    spotsRemaining: 30,
    registrationStatus: "open",
    registrationOpen: true,
    featured: true,
    stepUpEligible: true,
    // A parent picks one pricing path per registration pass — daily rate or
    // the full-week rate — not a combination of both. Both weeks (Dec 21-24
    // and Dec 28-31, around the Christmas Day / New Year's Day closures)
    // share this one Weekly Rate; see src/data/schedule.ts for the two
    // weeks shown separately on the calendar.
    sessionSelectionMode: "single",
    sessions: [
      {
        id: "christmas-camps-daily",
        programId: "christmas-camps",
        label: "Daily Rate",
        dateRange: "Dec 21 – Jan 1 (excludes Dec 25 & Jan 1 holidays) · Pick any day(s)",
        startDate: "2026-12-21",
        endDate: "2027-01-01",
        price: CAMP_DAILY_RATE,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
        // Christmas Day and New Year's Day excluded as closures. The
        // remaining 8 weekdays' exact operating status is still pending
        // client confirmation.
        dateSelection: {
          type: "daily",
          availableDates: [
            "2026-12-21",
            "2026-12-22",
            "2026-12-23",
            "2026-12-24",
            "2026-12-28",
            "2026-12-29",
            "2026-12-30",
            "2026-12-31",
          ],
        },
      },
      {
        id: "christmas-camps-weekly",
        programId: "christmas-camps",
        label: "Weekly Rate",
        dateRange: "Week of Dec 21–24 or Week of Dec 28–31",
        startDate: "2026-12-21",
        endDate: "2027-01-01",
        price: CAMP_WEEKLY_RATE,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
        dateSelection: {
          type: "weekly",
          availableWeeks: [
            { id: "christmas-week-1", label: "Week 1", startDate: "2026-12-21", endDate: "2026-12-24" },
            { id: "christmas-week-2", label: "Week 2", startDate: "2026-12-28", endDate: "2026-12-31" },
          ],
        },
      },
    ],
  },
  {
    id: "spring-break-camp",
    slug: "spring-break-camp",
    name: "Spring Break Camp",
    category: "Camp",
    participantType: "youth",
    shortDescription:
      "Make the most of spring break with active days filled with sports, games, team challenges, and fun with friends.",
    fullDescription:
      "When school lets out for Spring Break, FTK is in. Spring Break Camp keeps kids active and engaged with a full day of games, challenges, and coached sport sessions. Registration opens once FTK confirms the exact operating days, hours, and location for this camp.",
    image: "/about/coach-huddle.jpg",
    location: null,
    requiresSchoolSelection: false,
    scheduleDisplay:
      "Mar 15–19, 2027 (Sarasota County Schools Spring Break) · Schedule and location TBD",
    startDate: "2027-03-15",
    endDate: "2027-03-19",
    ageRange: "Grades K-6",
    gradeRange: "K-6",
    price: CAMP_DAILY_RATE,
    priceIsDemo: false,
    capacity: 30,
    capacityIsDemo: true,
    spotsRemaining: 30,
    // Not open yet — the school-break window is confirmed, but FTK's
    // operating days/hours/location for this camp are not. Flip to
    // registrationStatus: "open", registrationOpen: true (and update
    // scheduleDisplay/location above) once those are finalized; the
    // sessions below are already fully configured and ready to go live
    // with no further changes.
    registrationStatus: "coming-soon",
    registrationOpen: false,
    featured: false,
    stepUpEligible: true,
    sessionSelectionMode: "single",
    sessions: [
      {
        id: "spring-break-camp-daily",
        programId: "spring-break-camp",
        label: "Daily Rate",
        dateRange: "Mar 15–19, 2027 · Pick any day(s)",
        startDate: "2027-03-15",
        endDate: "2027-03-19",
        price: CAMP_DAILY_RATE,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: false,
        dateSelection: {
          type: "daily",
          availableDates: [
            "2027-03-15",
            "2027-03-16",
            "2027-03-17",
            "2027-03-18",
            "2027-03-19",
          ],
        },
      },
      {
        id: "spring-break-camp-weekly",
        programId: "spring-break-camp",
        label: "Weekly Rate",
        dateRange: "Mar 15–19, 2027 (full week)",
        startDate: "2027-03-15",
        endDate: "2027-03-19",
        price: CAMP_WEEKLY_RATE,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: false,
        dateSelection: {
          type: "weekly",
          availableWeeks: [
            {
              id: "spring-break-week",
              label: "Spring Break Week",
              startDate: "2027-03-15",
              endDate: "2027-03-19",
            },
          ],
        },
      },
    ],
  },
  {
    id: "youth-kickball",
    slug: "youth-kickball",
    name: "Youth Kickball",
    category: "League",
    participantType: "youth",
    shortDescription:
      "FTK's inaugural youth kickball league — 5 weeks of Saturday games for ages 4-12.",
    fullDescription:
      "Youth Kickball is FTK's inaugural kickball league for kids, with three age divisions (4-6, 7-9, and 10-12) playing on 10-player teams across a 5-week season. The 4-6 division is open to kids who must be 4, turning 5. Games are Saturdays at 9:00 AM at Turner Park at Skye Ranch Baseball Fields.",
    image:
      "https://images.unsplash.com/photo-1777489689168-497290f235d5?q=80&w=1600&auto=format&fit=crop",
    location: KICKBALL_LOCATION,
    requiresSchoolSelection: false,
    // Confirmed per the official flyer — see src/data/schedule.ts.
    scheduleDisplay: "Saturdays, 9:00 AM · 5-week Inaugural Season, Dec 5, 2026 – Jan 16, 2027",
    startDate: "2026-12-05",
    endDate: "2027-01-16",
    ageRange: "Ages 4–12 (divisions: 4-6 [must be 4, turning 5], 7-9, 10-12)",
    gradeRange: null,
    price: KICKBALL_PRICE_PER_REGISTRATION,
    priceIsDemo: false,
    capacity: null,
    capacityIsDemo: false,
    spotsRemaining: null,
    registrationStatus: "open",
    registrationOpen: true,
    featured: true,
    stepUpEligible: true,
    // Single-season league — one purchasable period.
    sessionSelectionMode: "single",
    sessions: [
      {
        id: "youth-kickball-inaugural-2026",
        programId: "youth-kickball",
        label: "Inaugural Season",
        dateRange: "Saturdays · Dec 5, 2026 – Jan 16, 2027",
        startDate: "2026-12-05",
        endDate: "2027-01-16",
        price: KICKBALL_PRICE_PER_REGISTRATION,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
      },
    ],
  },
  {
    id: "adult-kickball",
    slug: "adult-kickball",
    name: "Adult Kickball",
    category: "League",
    participantType: "adult",
    shortDescription:
      "FTK's inaugural adult kickball league — 5 weeks of Sunday games, 18+.",
    fullDescription:
      "Adult Kickball is FTK's inaugural kickball league for adults 18+, playing on 12-player teams across a 5-week season. Games are Sundays at 9:00 AM at Turner Park at Skye Ranch Baseball Fields.",
    image:
      "https://images.unsplash.com/photo-1782605178463-fa7c50b42e6f?q=80&w=1600&auto=format&fit=crop",
    location: KICKBALL_LOCATION,
    requiresSchoolSelection: false,
    // Confirmed per the official flyer — see src/data/schedule.ts.
    scheduleDisplay: "Sundays, 9:00 AM · 5-week Inaugural Season, Dec 6, 2026 – Jan 17, 2027",
    startDate: "2026-12-06",
    endDate: "2027-01-17",
    ageRange: "18+",
    gradeRange: null,
    price: KICKBALL_PRICE_PER_REGISTRATION,
    priceIsDemo: false,
    capacity: null,
    capacityIsDemo: false,
    spotsRemaining: null,
    registrationStatus: "open",
    registrationOpen: true,
    featured: true,
    stepUpEligible: true,
    sessionSelectionMode: "single",
    sessions: [
      {
        id: "adult-kickball-inaugural-2026",
        programId: "adult-kickball",
        label: "Inaugural Season",
        dateRange: "Sundays · Dec 6, 2026 – Jan 17, 2027",
        startDate: "2026-12-06",
        endDate: "2027-01-17",
        price: KICKBALL_PRICE_PER_REGISTRATION,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
      },
    ],
  },
  {
    id: "girls-flag-football",
    slug: "girls-flag-football",
    name: "Girls Flag Football",
    category: "League",
    participantType: "youth",
    shortDescription: "A girls-only flag football league.",
    fullDescription:
      "Girls Flag Football gives girls a competitive, skill-building flag football league of their own — coached fundamentals, real games, and a strong team environment.",
    image: "/about/girls-flag-football.jpg",
    location: null,
    requiresSchoolSelection: false,
    scheduleDisplay: "Wednesdays, 5:00–6:30 PM · Nov 4 – Dec 2, 2026 (season dates subject to change)",
    startDate: null,
    endDate: null,
    ageRange: "Grades 2-8",
    gradeRange: "2-8",
    price: LEAGUE_PRICE_PER_REGISTRATION,
    priceIsDemo: false,
    capacity: 24,
    capacityIsDemo: true,
    spotsRemaining: 24,
    // Registration is open for the season itself; the weekly Wednesday
    // dates are a realistic temporary pattern (see src/data/schedule.ts),
    // not yet confirmed by the client. Update both files together once
    // real dates land.
    registrationStatus: "open",
    registrationOpen: true,
    featured: false,
    stepUpEligible: true,
    sessionSelectionMode: "single",
    sessions: [
      {
        id: "girls-flag-football-fall-2026",
        programId: "girls-flag-football",
        label: "Fall 2026 Season",
        dateRange: "Wednesdays, Nov 4 – Dec 2, 2026",
        startDate: "2026-11-04",
        endDate: "2026-12-02",
        price: LEAGUE_PRICE_PER_REGISTRATION,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
      },
    ],
  },
  {
    id: "3v3-basketball",
    slug: "3v3-basketball",
    name: "3v3 Basketball",
    category: "League",
    participantType: "youth",
    shortDescription:
      "Fast-paced 3v3 basketball league.",
    fullDescription:
      "3v3 Basketball is a fast-paced, small-sided league format that means more touches, more shots, and more reps for every player on the court.",
    image:
      "https://images.unsplash.com/photo-1562552052-dbdd31c06339?q=80&w=1600&auto=format&fit=crop",
    location: null,
    requiresSchoolSelection: false,
    scheduleDisplay: "Thursdays, 5:30–7:00 PM · Nov 5 – Dec 3, 2026 (season dates subject to change)",
    startDate: null,
    endDate: null,
    ageRange: "Grades 3-8",
    gradeRange: "3-8",
    price: LEAGUE_PRICE_PER_REGISTRATION,
    priceIsDemo: false,
    capacity: 32,
    capacityIsDemo: true,
    spotsRemaining: 32,
    // Registration is open for the season itself; the weekly Thursday dates
    // are a realistic temporary pattern (see src/data/schedule.ts), not yet
    // confirmed by the client. Update both files together once real dates
    // land.
    registrationStatus: "open",
    registrationOpen: true,
    featured: false,
    stepUpEligible: true,
    sessionSelectionMode: "single",
    sessions: [
      {
        id: "3v3-basketball-fall-2026",
        programId: "3v3-basketball",
        label: "Fall 2026 Season",
        dateRange: "Thursdays, Nov 5 – Dec 3, 2026",
        startDate: "2026-11-05",
        endDate: "2026-12-03",
        price: LEAGUE_PRICE_PER_REGISTRATION,
        priceIsDemo: false,
        capacity: null,
        spotsRemaining: null,
        registrationOpen: true,
      },
    ],
  },
];

export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((program) => program.slug === slug);
}

export function getFeaturedPrograms(): Program[] {
  return programs.filter((program) => program.featured);
}

export function getProgramSession(programId: string, sessionId: string) {
  return programs.find((p) => p.id === programId)?.sessions.find((s) => s.id === sessionId);
}
