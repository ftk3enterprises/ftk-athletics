import type { TShirtSize } from "@/types";

/**
 * The single centralized list of selectable T-shirt sizes, mirroring
 * src/data/schools.ts's pattern for Select options. Keeping one list means
 * a size added/renamed here updates every picker (registration, profile,
 * admin) at once.
 */
export const TSHIRT_SIZE_OPTIONS: { value: TShirtSize; label: string; group: "Youth" | "Adult" }[] = [
  { value: "youth-xs", label: "Youth XS", group: "Youth" },
  { value: "youth-s", label: "Youth S", group: "Youth" },
  { value: "youth-m", label: "Youth M", group: "Youth" },
  { value: "youth-l", label: "Youth L", group: "Youth" },
  { value: "youth-xl", label: "Youth XL", group: "Youth" },
  { value: "adult-xs", label: "Adult XS", group: "Adult" },
  { value: "adult-s", label: "Adult S", group: "Adult" },
  { value: "adult-m", label: "Adult M", group: "Adult" },
  { value: "adult-l", label: "Adult L", group: "Adult" },
  { value: "adult-xl", label: "Adult XL", group: "Adult" },
  { value: "adult-2xl", label: "Adult 2XL", group: "Adult" },
  { value: "adult-3xl", label: "Adult 3XL", group: "Adult" },
];

export function getTshirtSizeLabel(value: TShirtSize | null | undefined): string {
  if (!value) return "";
  return TSHIRT_SIZE_OPTIONS.find((s) => s.value === value)?.label ?? value;
}
