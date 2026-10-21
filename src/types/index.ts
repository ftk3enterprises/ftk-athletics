// Core domain types shared across the app. These model the data shape the
// real backend (Supabase) will eventually return, so UI components can be
// written against them now and keep working once mocks are swapped out.

export type ParticipantType = "youth" | "adult" | "family";

export type RegistrationStatus =
  | "open"
  | "coming-soon"
  | "waitlist"
  | "closed";

export interface Program {
  id: string;
  slug: string;
  name: string;
  category: string;
  participantType: ParticipantType;
  shortDescription: string;
  fullDescription: string;
  image: string;
  location: string | null;
  /** True when registering for this program requires picking a school/location (see src/data/schools.ts). */
  requiresSchoolSelection: boolean;
  scheduleDisplay: string;
  startDate: string | null;
  endDate: string | null;
  ageRange: string | null;
  gradeRange: string | null;
  price: number | null;
  priceIsDemo: boolean;
  /**
   * Optional structured per-unit pricing shown as a breakdown under the
   * headline price (e.g. After School Clinic: $30/day × 4 days = $120 per
   * 4-week session). Omit for flat-rate or tiered-session (daily/weekly
   * camp) pricing — those render from `price`/`sessions` directly.
   */
  priceBreakdown?: {
    unitPrice: number;
    unitLabel: string;
    units: number;
    /** Label for the `units` count itself, e.g. "week" in "$30/day × 4 weeks" (distinct from unitLabel, the thing being priced). */
    unitsLabel: string;
    periodLabel: string;
  };
  capacity: number | null;
  capacityIsDemo: boolean;
  spotsRemaining: number | null;
  registrationStatus: RegistrationStatus;
  registrationOpen: boolean;
  featured: boolean;
  /** Whether Step Up For Students scholarship funds can be used toward this program. */
  stepUpEligible: boolean;
  /**
   * The purchasable periods within this program (a week of camp, a month of
   * a recurring clinic, a whole season, a single event date). Always has at
   * least one entry — even a one-day/one-season program models itself as a
   * single session — so registration always references a specific session,
   * never just the program.
   */
  sessions: ProgramSession[];
  /**
   * "multiple" lets a parent pick any combination of sessions in one visit
   * (e.g. camp weeks). "single" means only one session can be selected per
   * registration pass (e.g. a monthly clinic, where picking next month's
   * session happens on a later visit) — rendered as a radio choice.
   */
  sessionSelectionMode: "single" | "multiple";
  /**
   * True for programs whose sessions are tagged per-school (see
   * ProgramSession.schoolId) and browsed via the dedicated school-calendar
   * picker (AfterSchoolScheduleBlock) rather than the generic session
   * checkbox/radio list — currently just the After School Program.
   */
  schoolBasedSessions?: boolean;
}

/**
 * A specific purchasable period of a Program — the thing a Registration
 * actually references. Modeling this separately from Program (rather than
 * a single price/date pair on Program) is what lets "After School Clinic"
 * have an October session, a November session, etc., each independently
 * purchasable and independently marked paid.
 */
export interface ProgramSession {
  id: string;
  programId: string;
  /** Short label shown on session rows, e.g. "Week 1", "November 2026", "Full Season". */
  label: string;
  /** Human-readable date range, e.g. "Nov 23 – 27", or null if TBD. */
  dateRange: string | null;
  startDate: string | null;
  endDate: string | null;
  /** Per-unit price: the flat price for sessions without dateSelection, or the price per single day/week for sessions that have it. */
  price: number;
  priceIsDemo: boolean;
  capacity: number | null;
  spotsRemaining: number | null;
  registrationOpen: boolean;
  /**
   * When set, this session is a per-day or per-week rate — the parent must
   * pick specific units (see DateSelectionConfig) before it's purchasable,
   * and the total is `price` × number of units selected. Reusable for any
   * future program with a daily/weekly rate, not specific to any one camp.
   */
  dateSelection?: DateSelectionConfig;
  /** School this session runs at (see src/data/schools.ts values) — only set on schoolBasedSessions programs. */
  schoolId?: string;
  /**
   * The session's actual four class dates (ISO "YYYY-MM-DD"), one per week.
   * A schoolBasedSessions session is only available for registration once
   * this has exactly four real, client-confirmed dates — never invented.
   */
  classDates?: string[];
}

/** One selectable week block for a "weekly" DateSelectionConfig. */
export interface ProgramWeek {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface DateSelectionConfig {
  type: "daily" | "weekly";
  /** type "daily": the individual bookable calendar dates (ISO "YYYY-MM-DD"), already excluding closures/holidays. */
  availableDates?: string[];
  /** type "weekly": the selectable week blocks. */
  availableWeeks?: ProgramWeek[];
}

/**
 * A single dated occurrence on the schedule/calendar (one clinic session,
 * one camp block, one league date, etc). `programId` is null only for
 * standalone informational entries with no registration flow of their own
 * (e.g. the Kickball Tournament). Dates/times are the sole source of truth
 * for both the calendar and the upcoming-schedule list — never duplicate
 * this data elsewhere.
 */
export interface ScheduleEvent {
  id: string;
  programId: string | null;
  title: string;
  /** ISO "YYYY-MM-DD", local calendar date. */
  startDate: string;
  /** ISO "YYYY-MM-DD", inclusive. Equal to startDate for single-day events. */
  endDate: string;
  /** 24h "HH:MM", or null if time isn't set yet. */
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  status: RegistrationStatus;
  registrationOpen: boolean;
  /** True when the specific date is an invented placeholder pending client confirmation. */
  isDemoDate: boolean;
  /** Distinguishes a league's phases on the schedule/calendar — omit for events with no such phase (clinics, camps). */
  eventType?: "regular-season" | "tournament";
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Child {
  id: string;
  familyId: string;
  firstName: string;
  lastName: string;
  dob: string;
  grade: string;
  /** The child's current school, entered as free text by the parent. */
  school: string;
}

/**
 * Denormalized "current status" cache on Family for fast gating checks
 * (e.g. "has this family signed yet, skip the form"). The full signing
 * event — including exactly which participants/programs it covered — is
 * recorded separately in WaiverAcceptance so nothing richer is lost.
 */
export interface Waiver {
  familyId: string;
  accepted: boolean;
  acceptedAt: string | null;
  version: string;
  withdrawnAt: string | null;
}

/** One signing event, immutable once created — the audit record a real backend would keep. */
export interface WaiverAcceptance {
  id: string;
  familyId: string;
  userId: string;
  participantIds: string[];
  programIds: string[];
  version: string;
  signatureName: string;
  acceptedAt: string;
}

export interface Family {
  id: string;
  userId: string;
  parentName: string;
  email: string;
  phone: string;
  children: Child[];
  waiver: Waiver;
  /** Program ids the family flagged as interested in during profile setup. */
  interestedProgramIds: string[];
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/** One checkout session can cover several registrations (multiple participants/programs at once). */
export interface Payment {
  id: string;
  registrationIds: string[];
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  reference: string;
}

export type RegistrationRecordStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled";

/**
 * "online" charges a card through the (future) payment processor. "step_up"
 * means the family intends to pay with Step Up For Students scholarship
 * funds — handled entirely outside this app, so it never gets a Payment
 * record or an invented approval/funding status.
 */
export type RegistrationPaymentMethod = "online" | "step_up";

export interface Registration {
  id: string;
  familyId: string;
  programId: string;
  participantId: string; // Child id, or the user id when participantType === "adult"
  participantName: string;
  /** The specific session/week/month this registration is for — never just the program. */
  sessionId: string;
  /** Denormalized session label/date range at time of purchase, so history reads correctly even if session data changes later. */
  sessionLabel: string;
  sessionDateRange: string | null;
  status: RegistrationRecordStatus;
  paymentMethod: RegistrationPaymentMethod;
  /** Price of the selected session, not the program's headline price. */
  price: number;
  /** School/location chosen at registration time, for programs where requiresSchoolSelection is true. */
  schoolLocation: string | null;
  waiverAcceptedAt: string | null;
  paymentId: string | null;
  createdAt: string;
  /** Set only when the session had a DateSelectionConfig (a per-day/per-week rate). */
  rateType: "daily" | "weekly" | null;
  /** rateType "daily": the exact individual dates (ISO) this registration covers. */
  selectedDates: string[] | null;
  /** rateType "weekly": the exact week(s) this registration covers — full objects snapshotted at purchase time, so history reads correctly even if program config changes later. */
  selectedWeeks: ProgramWeek[] | null;
}

export type CancellationResolution = "credit" | "refund";

/**
 * A parent's request to cancel a registration. Never changes the
 * registration's actual status — FTK reviews the notification email and
 * handles each request manually.
 */
export interface CancellationRequest {
  id: string;
  registrationId: string;
  familyId: string;
  preferredResolution: CancellationResolution;
  reason: string;
  emailSent: boolean;
  emailError: string | null;
  createdAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: "team" | "program" | "season";
  website: string | null;
}

export interface SponsorInquiry {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: string;
}
