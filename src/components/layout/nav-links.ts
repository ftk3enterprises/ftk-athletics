import { programCategories } from "@/data/program-categories";

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export const programNavItems: NavLink[] = programCategories.map((category) => ({
  label: category.name,
  href: `/programs/category/${category.slug}`,
}));

export const primaryNavLinks: NavLink[] = [
  { label: "Schedule", href: "/schedule" },
  { label: "Step Up", href: "/#step-up" },
  { label: "Sponsors", href: "/#sponsors" },
  { label: "About", href: "/#about" },
];
