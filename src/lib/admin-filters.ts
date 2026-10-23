/**
 * Shared multi-select filter model for the admin Registrations page — used
 * by both the client table (src/components/admin/admin-registrations-table.tsx)
 * and the Excel export route (src/app/api/admin/export/route.ts) so the two
 * can never drift out of sync on what a given filter combination matches.
 *
 * Semantics: empty array in any group = no restriction from that group
 * ("All Programs" / "All Payment Statuses" / "All Requests"). Multiple
 * values within a group are OR'd together; the three groups are AND'd.
 */

export type RequestFilterValue = "requested" | "none";

export interface AdminFilterSelections {
  programs: string[];
  paymentStatuses: string[];
  requests: RequestFilterValue[];
}

export const EMPTY_ADMIN_FILTERS: AdminFilterSelections = {
  programs: [],
  paymentStatuses: [],
  requests: [],
};

export const PAYMENT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const REQUEST_OPTIONS: { value: RequestFilterValue; label: string }[] = [
  { value: "requested", label: "Cancellation Requested" },
  { value: "none", label: "No Request" },
];

export function countActiveFilters(filters: AdminFilterSelections): number {
  return filters.programs.length + filters.paymentStatuses.length + filters.requests.length;
}

export function hasActiveFilters(filters: AdminFilterSelections): boolean {
  return countActiveFilters(filters) > 0;
}

export function matchesProgram(filters: AdminFilterSelections, programName: string): boolean {
  return filters.programs.length === 0 || filters.programs.includes(programName);
}

export function matchesPaymentStatus(filters: AdminFilterSelections, paymentStatus: string): boolean {
  return filters.paymentStatuses.length === 0 || filters.paymentStatuses.includes(paymentStatus);
}

export function matchesRequest(filters: AdminFilterSelections, cancellationRequested: boolean): boolean {
  if (filters.requests.length === 0) return true;
  return filters.requests.some((r) => (r === "requested" ? cancellationRequested : !cancellationRequested));
}

export function filtersToSearchParams(filters: AdminFilterSelections): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.programs.length > 0) params.set("program", filters.programs.join(","));
  if (filters.paymentStatuses.length > 0) params.set("paymentStatus", filters.paymentStatuses.join(","));
  if (filters.requests.length > 0) params.set("cancellationStatus", filters.requests.join(","));
  return params;
}

export function searchParamsToFilters(params: URLSearchParams): AdminFilterSelections {
  const program = params.get("program");
  const paymentStatus = params.get("paymentStatus");
  const cancellationStatus = params.get("cancellationStatus");
  return {
    programs: program ? program.split(",").filter(Boolean) : [],
    paymentStatuses: paymentStatus ? paymentStatus.split(",").filter(Boolean) : [],
    requests: cancellationStatus
      ? (cancellationStatus.split(",").filter(Boolean) as RequestFilterValue[])
      : [],
  };
}
