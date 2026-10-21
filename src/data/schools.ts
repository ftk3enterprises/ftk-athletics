/**
 * The single centralized list of FTK school locations/affiliations, used
 * everywhere a school needs to be picked:
 *  - the After School Program's school/location selector (program site)
 *  - a child's "Current School" field on the family profile
 * Keeping one list means a school added/renamed here updates both places
 * automatically. `OTHER_SCHOOL_VALUE` always stays last and reveals a
 * required free-text input wherever it's used.
 */
export const OTHER_SCHOOL_VALUE = "other";

export const SCHOOLS: { value: string; label: string }[] = [
  { value: "skye-ranch", label: "Skye Ranch School" },
  { value: "lakeview-elementary", label: "Lakeview Elementary School" },
  { value: "brentwood-elementary", label: "Brentwood Elementary School" },
  { value: "phillippi-shores-elementary", label: "Phillippi Shores Elementary School" },
  { value: "ashton-elementary", label: "Ashton Elementary School" },
];

/** SCHOOLS plus the trailing "Other" option — use this to populate any school Select. */
export const SCHOOL_SELECT_OPTIONS: { value: string; label: string }[] = [
  ...SCHOOLS,
  { value: OTHER_SCHOOL_VALUE, label: "Other School Not Listed" },
];

export function getSchoolLabel(value: string): string | undefined {
  return SCHOOLS.find((s) => s.value === value)?.label;
}
