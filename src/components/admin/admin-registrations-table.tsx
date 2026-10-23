"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Loader2, Search, X } from "lucide-react";
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
  REQUEST_OPTIONS,
  filtersToSearchParams,
  hasActiveFilters,
  matchesPaymentStatus,
  matchesProgram,
  matchesRequest,
  type AdminFilterSelections,
} from "@/lib/admin-filters";
import { programs } from "@/data/programs";
import type { AdminRegistrationRow } from "@/services/admin-service";
import type { PaymentStatus } from "@/types";

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: "bg-carolina text-navy",
  pending: "bg-muted text-muted-foreground",
  failed: "bg-impact text-impact-foreground",
  refunded: "bg-ink/10 text-ink",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  online: "Pay Online",
  step_up: "Step Up For Students",
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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminFilterSelections>(EMPTY_ADMIN_FILTERS);
  const [detailsRow, setDetailsRow] = useState<AdminRegistrationRow | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (query) {
        const haystack = `${row.parentName} ${row.participantName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (!matchesProgram(filters, row.programName)) return false;
      if (!matchesPaymentStatus(filters, row.paymentStatus)) return false;
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
            label="Requests"
            allLabel="All Requests"
            options={REQUEST_OPTIONS}
            selected={filters.requests}
            onChange={(next) => setFilters((prev) => ({ ...prev, requests: next }))}
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
          <Table className="min-w-[1240px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Parent</TableHead>
                <TableHead className="min-w-[130px]">Participant</TableHead>
                <TableHead className="min-w-[170px]">Program</TableHead>
                <TableHead className="min-w-[230px]">Selected Period / Dates</TableHead>
                <TableHead className="min-w-[115px]">Registered</TableHead>
                <TableHead className="min-w-[90px] text-right">Amount</TableHead>
                <TableHead className="min-w-[160px]">Payment Status</TableHead>
                <TableHead className="min-w-[200px]">Request Status</TableHead>
                <TableHead className="min-w-[110px]">Details</TableHead>
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
                    {row.paymentMethod === "step_up" ? (
                      <span className="inline-flex items-center rounded-sm bg-navy/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
                        Step Up Payment
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${PAYMENT_STATUS_STYLES[row.paymentStatus as PaymentStatus]}`}
                      >
                        {row.paymentStatus}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.cancellationRequested ? (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                        Cancellation Requested
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
                <DetailRow label="Payment Status" value={detailsRow.paymentStatus} />
                <DetailRow label="Registration Status" value={detailsRow.registrationStatus} />
              </dl>

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
