"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type CancellationFilter = "all" | "requested" | "none";

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

export function AdminRegistrationsTable({ rows }: { rows: AdminRegistrationRow[] }) {
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [cancellationStatus, setCancellationStatus] = useState<CancellationFilter>("all");
  const [detailsRow, setDetailsRow] = useState<AdminRegistrationRow | null>(null);

  const programOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.programName))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (query) {
        const haystack = `${row.parentName} ${row.participantName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (program !== "all" && row.programName !== program) return false;
      if (paymentStatus !== "all" && row.paymentStatus !== paymentStatus) return false;
      if (cancellationStatus === "requested" && !row.cancellationRequested) return false;
      if (cancellationStatus === "none" && row.cancellationRequested) return false;
      return true;
    });
  }, [rows, search, program, paymentStatus, cancellationStatus]);

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (program !== "all") params.set("program", program);
    if (paymentStatus !== "all") params.set("paymentStatus", paymentStatus);
    if (cancellationStatus !== "all") params.set("cancellationStatus", cancellationStatus);
    const query = params.toString();
    return query ? `/api/admin/export?${query}` : "/api/admin/export";
  }, [search, program, paymentStatus, cancellationStatus]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parent or participant..."
              className="h-9 pl-8"
              aria-label="Search by parent or participant name"
            />
          </div>

          <Select value={program} onValueChange={(v) => setProgram(v as string)}>
            <SelectTrigger className="h-9 w-full sm:w-48" aria-label="Filter by program">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as string)}>
            <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by payment status">
              <SelectValue placeholder="All Payment Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={cancellationStatus}
            onValueChange={(v) => setCancellationStatus(v as CancellationFilter)}
          >
            <SelectTrigger className="h-9 w-full sm:w-52" aria-label="Filter by cancellation request status">
              <SelectValue placeholder="All Requests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="requested">Cancellation Requested</SelectItem>
              <SelectItem value="none">No Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <a
          href={exportHref}
          className="inline-flex h-10 w-fit shrink-0 items-center gap-2 rounded-sm bg-carolina px-5 font-heading text-sm uppercase text-navy transition-colors hover:bg-carolina/90"
        >
          <Download className="size-4" aria-hidden />
          Export To Excel
        </a>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Showing {filteredRows.length} of {rows.length} registration{rows.length === 1 ? "" : "s"}
      </p>

      {/* Table */}
      <div className="mt-4 rounded-sm border border-border">
        {filteredRows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No registrations match your filters.
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
