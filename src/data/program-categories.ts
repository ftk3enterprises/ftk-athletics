import { programs, sortByRegistrationStatus } from "@/data/programs";
import type { Program } from "@/types";

/**
 * Two-level Programs information architecture: category → program(s).
 * Relational by design (categories reference program ids) so a category can
 * gain additional programs later without touching the nav, homepage, or
 * category page code. Order here drives display order everywhere.
 */
export interface ProgramCategory {
  id: string;
  slug: string;
  name: string;
  /**
   * Broad, evergreen description of the category itself — describes the
   * TYPE of offering, not the current specific program(s) under it. Never
   * mention specific program names, dates, locations, or registration
   * status here; that detail belongs on the program/category listing pages
   * and the schedule. Keeping this generic means the card never needs to
   * change just because this season's specific offering changes.
   */
  description: string;
  /** Label used on the single-program CTA when that program isn't open for registration, and on the category page heading. */
  ctaLabel: string;
  programIds: string[];
  /**
   * Overrides the homepage showcase image (program-showcase.tsx), which
   * otherwise defaults to the first program's own `image`. Use this when
   * the category's representative photo shouldn't be tied to — and
   * shouldn't change along with — any one program's own page/listing image.
   */
  image?: string;
}

export const programCategories: ProgramCategory[] = [
  {
    id: "after-school-program",
    slug: "after-school-program",
    name: "After School Program",
    description: "Athletic performance, sport conditioning, movement, and organized play after the final bell.",
    ctaLabel: "Train After School",
    programIds: ["after-school-clinic"],
  },
  {
    id: "camps",
    slug: "camps",
    name: "Camps",
    description:
      "High-energy sports camps for summer, holidays, teacher workdays, and every school break.",
    ctaLabel: "Find a camp",
    programIds: ["thanksgiving-camp", "christmas-camps", "spring-break-camp"],
    image: "/about/camp.jpg",
  },
  {
    id: "youth-leagues",
    slug: "youth-leagues",
    name: "Youth Leagues",
    description:
      "Kickball, 3v3 basketball, girls-only flag football, and volleyball.",
    ctaLabel: "Choose Youth Leagues",
    programIds: ["youth-kickball", "girls-flag-football", "3v3-basketball"],
    image:
      "https://images.unsplash.com/photo-1777489689168-497290f235d5?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "adult-leagues",
    slug: "adult-leagues",
    name: "Adult Leagues",
    description:
      "Organized play for adults who want competition, community, and a reason to keep moving.",
    ctaLabel: "Join the Adults",
    programIds: ["adult-kickball", "3v3-adult-basketball"],
  },
  {
    id: "community-events",
    slug: "community-events",
    name: "Community Events",
    description:
      "One-off, family-friendly community events — no season-long commitment required.",
    ctaLabel: "See Community Events",
    programIds: ["nerf-battles"],
  },
];

export function getCategoryBySlug(slug: string): ProgramCategory | undefined {
  return programCategories.find((c) => c.slug === slug);
}

export function getCategoryPrograms(category: ProgramCategory): Program[] {
  const matched = category.programIds
    .map((id) => programs.find((p) => p.id === id))
    .filter((p): p is Program => Boolean(p));
  return sortByRegistrationStatus(matched);
}

export function getCategoryForProgram(programId: string): ProgramCategory | undefined {
  return programCategories.find((c) => c.programIds.includes(programId));
}
