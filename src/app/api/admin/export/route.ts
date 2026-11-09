import * as XLSX from "xlsx";
import { listAdminExportRows } from "@/services/admin-service";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import {
  matchesPaymentStatus,
  matchesProgram,
  matchesRegistrationStatus,
  matchesRequest,
  searchParamsToFilters,
} from "@/lib/admin-filters";

const HEADERS = [
  "Registration ID",
  "Registration Date",
  "Parent/Guardian Name",
  "Parent Email",
  "Parent Phone",
  "Participant Name",
  "Participant Type",
  "T-Shirt Size",
  "Child Name",
  "Child Date of Birth",
  "Child Grade",
  "Current School",
  "Program",
  "Session / Dates",
  "Rate Type",
  "Selected Dates / Weeks",
  "Number of Days / Weeks",
  "Program Location",
  "Amount",
  "Payment Method",
  "Payment Status",
  "Registration Status",
  "Cancellation Request Status",
  "Preferred Resolution",
  "Cancellation Reason",
  "Request Date",
  "Registered School / Location",
  "Also Interested In (From Profile)",
  "Interested In Coaching",
  "Interested In Volunteering",
  "Interested In Sponsorship",
  "Cash Collected",
  "Cash Collected At",
  "Step Up Received",
  "Step Up Received At",
] as const;

const REGISTRATION_STATUS_LABEL: Record<string, string> = {
  interested: "Interested",
  pending_payment: "Pending Payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  online: "Pay Online",
  step_up: "Step Up For Students",
  cash: "Cash",
};

const RATE_TYPE_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
};

const RESOLUTION_LABEL: Record<string, string> = {
  credit: "Credit Toward Future Program",
  refund: "Refund",
};

/**
 * Prevents spreadsheet formula injection: Excel/Sheets treats a cell
 * starting with =, +, -, or @ as a formula when the file is opened, which
 * is dangerous for any value that came from user input (reason, names,
 * etc.). Prefixing with a straight quote forces it to display as plain
 * text without changing the visible value.
 */
function sanitizeCell(value: string): string {
  if (/^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US");
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return new Response("Not authorized.", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const filters = searchParamsToFilters(searchParams);

  const allRows = await listAdminExportRows();

  const rows = allRows.filter((row) => {
    if (search) {
      const haystack = `${row.parentName} ${row.participantName}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (!matchesProgram(filters, row.programName)) return false;
    if (!matchesPaymentStatus(filters, row.paymentStatus)) return false;
    if (!matchesRegistrationStatus(filters, row.registrationStatus)) return false;
    if (!matchesRequest(filters, row.cancellationStatus === "Cancellation Requested")) return false;
    return true;
  });

  const sheetRows = rows.map((row) => ({
    [HEADERS[0]]: sanitizeCell(row.registrationId),
    [HEADERS[1]]: formatDateTime(row.registeredAt),
    [HEADERS[2]]: sanitizeCell(row.parentName),
    [HEADERS[3]]: sanitizeCell(row.parentEmail),
    [HEADERS[4]]: sanitizeCell(row.parentPhone),
    [HEADERS[5]]: sanitizeCell(row.participantName),
    [HEADERS[6]]: row.participantType,
    [HEADERS[7]]: row.tshirtSize,
    [HEADERS[8]]: row.childName ? sanitizeCell(row.childName) : "",
    [HEADERS[9]]: formatDate(row.childDob),
    [HEADERS[10]]: row.childGrade ? sanitizeCell(row.childGrade) : "",
    [HEADERS[11]]: row.currentSchool ? sanitizeCell(row.currentSchool) : "",
    [HEADERS[12]]: sanitizeCell(row.programName),
    [HEADERS[13]]: sanitizeCell(
      [row.sessionLabel, row.sessionDateRange].filter(Boolean).join(" · ")
    ),
    [HEADERS[14]]: row.rateType ? RATE_TYPE_LABEL[row.rateType] : "",
    [HEADERS[15]]: row.rateType && row.sessionDateRange ? sanitizeCell(row.sessionDateRange) : "",
    [HEADERS[16]]: row.unitCount ?? "",
    [HEADERS[17]]: row.programLocation ? sanitizeCell(row.programLocation) : "",
    [HEADERS[18]]: row.amount,
    [HEADERS[19]]: PAYMENT_METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod,
    [HEADERS[20]]:
      row.registrationStatus === "interested"
        ? "No Payment Required"
        : row.paymentMethod === "cash"
          ? row.cashCollectedAt
            ? "Cash Collected"
            : "Cash Payment Due"
          : row.paymentMethod === "step_up"
            ? row.stepUpReceivedAt
              ? "Step Up Received"
              : "Step Up Payment Due"
            : row.paymentStatus,
    [HEADERS[21]]: REGISTRATION_STATUS_LABEL[row.registrationStatus] ?? row.registrationStatus,
    [HEADERS[22]]: row.cancellationStatus,
    [HEADERS[23]]: row.preferredResolution ? RESOLUTION_LABEL[row.preferredResolution] : "",
    [HEADERS[24]]: row.cancellationReason ? sanitizeCell(row.cancellationReason) : "",
    [HEADERS[25]]: formatDateTime(row.requestDate),
    [HEADERS[26]]: row.schoolLocation ? sanitizeCell(row.schoolLocation) : "",
    [HEADERS[27]]: row.familyInterestedPrograms.length > 0 ? sanitizeCell(row.familyInterestedPrograms.join(", ")) : "",
    [HEADERS[28]]: row.interestedInCoaching ? "Yes" : "No",
    [HEADERS[29]]: row.interestedInVolunteering ? "Yes" : "No",
    [HEADERS[30]]: row.interestedInSponsorship ? "Yes" : "No",
    [HEADERS[31]]: row.paymentMethod === "cash" ? (row.cashCollectedAt ? "Yes" : "No") : "N/A",
    [HEADERS[32]]: formatDateTime(row.cashCollectedAt),
    [HEADERS[33]]: row.paymentMethod === "step_up" ? (row.stepUpReceivedAt ? "Yes" : "No") : "N/A",
    [HEADERS[34]]: formatDateTime(row.stepUpReceivedAt),
  }));

  const worksheet =
    sheetRows.length > 0
      ? XLSX.utils.json_to_sheet(sheetRows, { header: [...HEADERS] })
      : XLSX.utils.aoa_to_sheet([HEADERS as unknown as string[]]);

  worksheet["!cols"] = HEADERS.map((h) => ({ wch: Math.max(h.length, 14) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filename = `ftk-registrations-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
