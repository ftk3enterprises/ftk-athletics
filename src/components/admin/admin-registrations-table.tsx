"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Eye, Loader2, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultiSelectDropdown } from "@/components/admin/multi-select-dropdown";
import { MobileFilterSheet } from "@/components/admin/mobile-filter-sheet";
import {
  EMPTY_ADMIN_FILTERS,
  PAYMENT_STATUS_OPTIONS,
  REGISTRATION_STATUS_OPTIONS,
  REQUEST_OPTIONS,
  filtersToSearchParams,
  hasActiveFilters,
  matchesPaymentStatus,
  matchesProgram,
  matchesRegistrationStatus,
  matchesRequest,
  type AdminFilterSelections,
  type RequestFilterValue,
} from "@/lib/admin-filters";
import { programs } from "@/data/programs";
import type { AdminRegistrationRow } from "@/services/admin-service";

const REGISTRATION_STATUS_STYLES: Record<string, string> = {
  interested: "bg-[#B45309] text-white",
  pending_payment: "bg-muted text-muted-foreground",
  confirmed: "bg-carolina text-navy",
  cancelled: "bg-ink/10 text-ink",
};

const REGISTRATION_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  REGISTRATION_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  online: "Pay Online",
  step_up: "Step Up For Students",
  cash: "Cash",
};

const RESOLUTION_LABEL: Record<string, string> = {
  credit: "Credit Toward Future Program",
  refund: "Refund",
};

const REQUEST_LABEL: Record<string, string> = Object.fromEntries(
  REQUEST_OPTIONS.map((o) => [o.value, o.label])
);

const PAYMENT_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_STATUS_OPTIONS.map((o) => [o.value, o.label])
);

/** Every program currently advertised on the site — never a separate hardcoded list, so new/renamed/removed programs show up here automatically. */
const PROGRAM_OPTIONS = Array.from(new Set(programs.map((p) => p.name))).sort();

interface StatusDisplay {
  label: string;
  className: string;
  icon?: boolean;
  /** Smaller explanatory text under the badge, e.g. "No Payment Required". */
  secondary?: string;
  /** Which confirm-payment action to offer, if any. */
  action?: "cash" | "step_up";
}

/**
 * Collapses the registration status and payment status/method (three
 * separate pieces of data — see AdminRegistrationRow) into the one most
 * relevant badge for the admin table's merged Status column. The Details
 * dialog still shows registration status and payment status as two
 * distinct fields — this is a display simplification for the grid only,
 * nothing about the underlying data changes.
 */
function getStatusDisplay(row: AdminRegistrationRow): StatusDisplay {
  if (row.registrationStatus === "cancelled") {
    return { label: "Cancelled", className: REGISTRATION_STATUS_STYLES.cancelled };
  }
  if (row.registrationStatus === "interested") {
    return {
      label: "Interested",
      className: REGISTRATION_STATUS_STYLES.interested,
      secondary: "No Payment Required",
    };
  }
  if (row.paymentMethod === "cash") {
    return row.cashCollectedAt
      ? { label: "Cash Collected", className: "bg-carolina text-navy", icon: true }
      : { label: "Cash Payment Due", className: "bg-[#B45309] text-white", action: "cash" };
  }
  if (row.paymentMethod === "step_up") {
    return row.stepUpReceivedAt
      ? { label: "Step Up Received", className: "bg-carolina text-navy", icon: true }
      : { label: "Step Up Payment Due", className: "bg-navy/10 text-navy", action: "step_up" };
  }
  // Online/card payments — driven by the linked Payment record's status.
  if (row.paymentStatus === "paid") {
    return { label: "Paid", className: "bg-carolina text-navy", icon: true };
  }
  if (row.paymentStatus === "failed") {
    return { label: "Failed", className: "bg-impact text-impact-foreground" };
  }
  if (row.paymentStatus === "refunded") {
    return { label: "Refunded", className: "bg-ink/10 text-ink" };
  }
  return { label: "Payment Pending", className: REGISTRATION_STATUS_STYLES.pending_payment };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-navy break-words">{value || "—"}</dd>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  );
}

export function AdminRegistrationsTable({ rows }: { rows: AdminRegistrationRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminFilterSelections>(EMPTY_ADMIN_FILTERS);
  const [detailsRow, setDetailsRow] = useState<AdminRegistrationRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  /** Manually confirms a cash or Step Up payment — see the route's own doc comment. */
  async function handleConfirmPayment(registrationId: string) {
    setConfirmingId(registrationId);
    try {
      const res = await fetch(`/api/admin/registrations/${registrationId}/confirm-payment`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      window.alert("Couldn't confirm this payment. Please try again.");
    } finally {
      setConfirmingId(null);
    }
  }

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (query) {
        const haystack = `${row.parentName} ${row.participantName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (!matchesProgram(filters, row.programName)) return false;
      if (!matchesPaymentStatus(filters, row.paymentStatus)) return false;
      if (!matchesRegistrationStatus(filters, row.registrationStatus)) return false;
      if (!matchesRequest(filters, row.cancellationRequested)) return false;
      return true;
    });
  }, [rows, search, filters]);

  const exportHref = useMemo(() => {
    const params = filtersToSearchParams(filters);
    if (search.trim()) params.set("search", search.trim());
    const query = params.toString();
    return query ? `/api/admin/export?${query}` : "/api/admin/export";
  }, [search, filters]);

  function clearAll() {
    setSearch("");
    setFilters(EMPTY_ADMIN_FILTERS);
  }

  function removeFilter(group: keyof AdminFilterSelections, value: string) {
    setFilters((prev) => ({
      ...prev,
      [group]: (prev[group] as string[]).filter((v) => v !== value),
    }));
  }

  /**
   * Fetches and saves the file via blob instead of a plain `<a href>`
   * navigation. On the Cloudflare Workers deployment, a top-level document
   * navigation to this route intermittently returns 503 (the static-assets
   * layer appears to intercept navigation requests ahead of the Worker) even
   * though the exact same request succeeds every time as a same-page fetch.
   * This sidesteps that — and works identically on any host.
   */
  async function handleExport() {
    setIsExporting(true);
    try {
      const res = await fetch(exportHref);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const match = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "ftk-registrations.xlsx";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  const filtersActive = hasActiveFilters(filters);

  return (
    <div>
      {/* Search — always visible, shared by mobile and desktop */}
      <div className="relative w-full sm:w-64">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parent or participant..."
          className="h-9 w-full pl-8"
          aria-label="Search by parent or participant name"
        />
      </div>

      {/* Mobile controls: Filters button + icon-only export, in a compact row below search */}
      <div className="mt-3 flex items-center gap-2 sm:hidden">
        <MobileFilterSheet
          programOptions={PROGRAM_OPTIONS}
          filters={filters}
          onApply={setFilters}
        />
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          aria-label="Export to Excel"
          title="Export to Excel"
          className="inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-sm bg-carolina text-navy transition-colors hover:bg-carolina/90 disabled:opacity-60"
        >
          {isExporting ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Download className="size-5" aria-hidden />
          )}
        </button>
      </div>

      {/* Desktop controls: multi-select dropdowns + labeled export button */}
      <div className="mt-3 hidden flex-col gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <MultiSelectDropdown
            label="Programs"
            allLabel="All Programs"
            options={PROGRAM_OPTIONS.map((name) => ({ value: name, label: name }))}
            selected={filters.programs}
            onChange={(next) => setFilters((prev) => ({ ...prev, programs: next }))}
            className="sm:w-48"
          />
          <MultiSelectDropdown
            label="Payment Statuses"
            allLabel="All Payment Statuses"
            options={PAYMENT_STATUS_OPTIONS}
            selected={filters.paymentStatuses}
            onChange={(next) => setFilters((prev) => ({ ...prev, paymentStatuses: next }))}
            className="sm:w-48"
          />
          <MultiSelectDropdown
            label="Registration Statuses"
            allLabel="All Registration Statuses"
            options={REGISTRATION_STATUS_OPTIONS}
            selected={filters.registrationStatuses}
            onChange={(next) => setFilters((prev) => ({ ...prev, registrationStatuses: next }))}
            className="sm:w-56"
          />
          <MultiSelectDropdown
            label="Requests"
            allLabel="All Requests"
            options={REQUEST_OPTIONS}
            selected={filters.requests}
            onChange={(next) => setFilters((prev) => ({ ...prev, requests: next as RequestFilterValue[] }))}
            className="sm:w-48"
          />
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-sm bg-carolina px-5 font-heading text-sm uppercase text-navy transition-colors hover:bg-carolina/90 disabled:opacity-60"
        >
          <Download className="size-4" aria-hidden />
          {isExporting ? "Exporting…" : "Export To Excel"}
        </button>
      </div>

      {/* Active filter chips — desktop only; mobile shows the count on the Filters button itself */}
      {filtersActive && (
        <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
          {filters.programs.map((p) => (
            <FilterChip key={`program-${p}`} label={p} onRemove={() => removeFilter("programs", p)} />
          ))}
          {filters.paymentStatuses.map((p) => (
            <FilterChip
              key={`status-${p}`}
              label={PAYMENT_STATUS_LABEL[p] ?? p}
              onRemove={() => removeFilter("paymentStatuses", p)}
            />
          ))}
          {filters.registrationStatuses.map((s) => (
            <FilterChip
              key={`regstatus-${s}`}
              label={REGISTRATION_STATUS_LABEL[s] ?? s}
              onRemove={() => removeFilter("registrationStatuses", s)}
            />
          ))}
          {filters.requests.map((r) => (
            <FilterChip
              key={`request-${r}`}
              label={REQUEST_LABEL[r] ?? r}
              onRemove={() => removeFilter("requests", r)}
            />
          ))}
          <button
            type="button"
            onClick={() => setFilters(EMPTY_ADMIN_FILTERS)}
            className="text-xs font-semibold uppercase tracking-wide text-impact hover:underline"
          >
            Clear All
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Showing {filteredRows.length} of {rows.length} registration{rows.length === 1 ? "" : "s"}
      </p>

      {/* Table */}
      <div className="mt-4 rounded-sm border border-border">
        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-muted-foreground">
            No registrations match your filters.
            {(filtersActive || search.trim()) && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-sm border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy transition-colors hover:bg-muted"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[130px]">Parent</TableHead>
                <TableHead className="min-w-[110px]">Participant</TableHead>
                <TableHead className="min-w-[140px]">Program</TableHead>
                <TableHead className="min-w-[200px]">Selected Period / Dates</TableHead>
                <TableHead className="min-w-[100px]">Registered</TableHead>
                <TableHead className="min-w-[80px] text-right">Amount</TableHead>
                <TableHead className="min-w-[170px]">Status</TableHead>
                <TableHead className="min-w-[90px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow
                  key={row.registrationId}
                  className={row.cancellationRequested ? "bg-amber-50" : undefined}
                >
                  <TableCell className="font-medium text-navy">{row.parentName}</TableCell>
                  <TableCell>{row.participantName}</TableCell>
                  <TableCell>{row.programName}</TableCell>
                  <TableCell className="whitespace-normal">
                    <span className="flex items-center gap-1.5 text-navy">
                      {row.sessionLabel}
                      {row.rateType && (
                        <span className="rounded-sm bg-navy/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                          {row.rateType}
                        </span>
                      )}
                    </span>
                    {row.sessionDateRange && (
                      <span className="block text-xs text-muted-foreground">
                        {row.sessionDateRange}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(row.registeredAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium text-navy">${row.amount}</TableCell>
                  <TableCell>
                    {(() => {
                      const status = getStatusDisplay(row);
                      return (
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${status.className}`}
                          >
                            {status.icon && <CheckCircle2 className="size-3.5" aria-hidden />}
                            {status.label}
                          </span>
                          {status.secondary && (
                            <span className="text-xs text-muted-foreground">{status.secondary}</span>
                          )}
                          {status.action && (
                            <button
                              type="button"
                              onClick={() => handleConfirmPayment(row.registrationId)}
                              disabled={confirmingId === row.registrationId}
                              className="text-xs font-semibold uppercase tracking-wide text-impact hover:underline disabled:opacity-60"
                            >
                              {confirmingId === row.registrationId
                                ? "Marking..."
                                : status.action === "cash"
                                  ? "Mark As Collected"
                                  : "Mark As Received"}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setDetailsRow(row)}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy transition-colors hover:bg-muted"
                    >
                      <Eye className="size-3.5" aria-hidden />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={detailsRow !== null} onOpenChange={(open) => !open && setDetailsRow(null)}>
        <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm sm:max-w-lg">
          {detailsRow && (
            <>
              <DialogHeader>
                <DialogTitle>Registration Details</DialogTitle>
                <DialogDescription>
                  {detailsRow.participantName} · {detailsRow.programName}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailRow label="Parent Name" value={detailsRow.parentName} />
                <DetailRow label="Parent Email" value={detailsRow.parentEmail} />
                <DetailRow label="Parent Phone" value={detailsRow.parentPhone} />
                <DetailRow label="Participant" value={detailsRow.participantName} />
                <DetailRow label="Child's School" value={detailsRow.childSchool ?? ""} />
                <DetailRow label="Child's Grade" value={detailsRow.childGrade ?? ""} />
                <DetailRow label="Program" value={detailsRow.programName} />
                <DetailRow
                  label="Selected Dates / Weeks"
                  value={
                    [detailsRow.sessionLabel, detailsRow.sessionDateRange].filter(Boolean).join(" · ")
                  }
                />
                {detailsRow.schoolLocation && (
                  <DetailRow label="Registered School / Location" value={detailsRow.schoolLocation} />
                )}
                <DetailRow
                  label="Registration Date"
                  value={new Date(detailsRow.registeredAt).toLocaleString()}
                />
                <DetailRow label="Amount" value={`$${detailsRow.amount}`} />
                <DetailRow
                  label="Payment Method"
                  value={PAYMENT_METHOD_LABEL[detailsRow.paymentMethod] ?? detailsRow.paymentMethod}
                />
                <DetailRow
                  label="Payment Status"
                  value={
                    detailsRow.registrationStatus === "interested"
                      ? "No Payment Required"
                      : detailsRow.paymentMethod === "cash"
                        ? detailsRow.cashCollectedAt
                          ? `Cash Collected (${new Date(detailsRow.cashCollectedAt).toLocaleString()})`
                          : "Cash Payment Due"
                        : detailsRow.paymentMethod === "step_up"
                          ? detailsRow.stepUpReceivedAt
                            ? `Step Up Received (${new Date(detailsRow.stepUpReceivedAt).toLocaleString()})`
                            : "Step Up Payment Due"
                          : detailsRow.paymentStatus
                  }
                />
                <DetailRow
                  label="Registration Status"
                  value={REGISTRATION_STATUS_LABEL[detailsRow.registrationStatus] ?? detailsRow.registrationStatus}
                />
                <DetailRow
                  label="Also Interested In (From Profile)"
                  value={detailsRow.familyInterestedPrograms.join(", ") || "None"}
                />
                <DetailRow label="Interested In Coaching" value={detailsRow.interestedInCoaching ? "Yes" : "No"} />
                <DetailRow
                  label="Interested In Volunteering"
                  value={detailsRow.interestedInVolunteering ? "Yes" : "No"}
                />
                <DetailRow
                  label="Interested In Sponsorship"
                  value={detailsRow.interestedInSponsorship ? "Yes" : "No"}
                />
              </dl>

              {((detailsRow.paymentMethod === "cash" && !detailsRow.cashCollectedAt) ||
                (detailsRow.paymentMethod === "step_up" && !detailsRow.stepUpReceivedAt)) && (
                <button
                  type="button"
                  onClick={() => handleConfirmPayment(detailsRow.registrationId)}
                  disabled={confirmingId === detailsRow.registrationId}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-impact px-3 py-2 text-xs font-semibold uppercase tracking-wide text-impact-foreground transition-colors hover:bg-impact/90 disabled:opacity-60"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {confirmingId === detailsRow.registrationId
                    ? "Marking..."
                    : detailsRow.paymentMethod === "cash"
                      ? "Mark Cash As Collected"
                      : "Mark Step Up As Received"}
                </button>
              )}

              {detailsRow.cancellationRequested && (
                <div className="rounded-sm border border-amber-300 bg-amber-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                    Cancellation Requested
                  </p>
                  <dl className="mt-2 grid grid-cols-1 gap-y-2 text-sm">
                    <DetailRow
                      label="Preferred Resolution"
                      value={
                        detailsRow.preferredResolution
                          ? (RESOLUTION_LABEL[detailsRow.preferredResolution] ?? detailsRow.preferredResolution)
                          : ""
                      }
                    />
                    <DetailRow label="Reason" value={detailsRow.cancellationReason ?? ""} />
                    <DetailRow
                      label="Request Date"
                      value={
                        detailsRow.cancellationRequestDate
                          ? new Date(detailsRow.cancellationRequestDate).toLocaleString()
                          : ""
                      }
                    />
                  </dl>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
