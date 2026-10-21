import type { Sponsor } from "@/types";

/**
 * No sponsor roster has been supplied by the client yet, so this holds
 * clearly-labeled placeholder tiles rather than invented business names.
 * Swap these for the real sponsor list (name + logo) as soon as it's
 * available — the Sponsors section reads straight from this array.
 */
export const sponsors: Sponsor[] = [
  { id: "sponsor-1", name: "Sponsor Spot Available", logo: "", tier: "season", website: null },
  { id: "sponsor-2", name: "Sponsor Spot Available", logo: "", tier: "program", website: null },
  { id: "sponsor-3", name: "Sponsor Spot Available", logo: "", tier: "program", website: null },
  { id: "sponsor-4", name: "Sponsor Spot Available", logo: "", tier: "team", website: null },
  { id: "sponsor-5", name: "Sponsor Spot Available", logo: "", tier: "team", website: null },
  { id: "sponsor-6", name: "Sponsor Spot Available", logo: "", tier: "team", website: null },
];
