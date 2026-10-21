import * as XLSX from "xlsx";
import { listAdminExportRows } from "@/services/admin-service";
import { isCurrentUserAdmin } from "@/lib/admin-auth";

const HEADERS = [
  "Registration ID",
  "Registration Date",
  "Parent/Guardian Name",
  "Parent Email",
  "Parent Phone",
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
] as const;

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  online: "Pay Online",
  step_up: "Step Up For Students",
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
  const program = searchParams.get("program") ?? "";
  const paymentStatus = searchParams.get("paymentStatus") ?? "";
  const cancellationStatus = searchParams.get("cancellationStatus") ?? "";

  const allRows = await listAdminExportRows();

  const rows = allRows.filter((row) => {
    if (search) {
      const haystack = `${row.parentName} ${row.childName ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (program && row.programName !== program) return false;
    if (paymentStatus && row.paymentStatus !== paymentStatus) return false;
    if (cancellationStatus === "requested" && row.cancellationStatus !== "Cancellation Requested") {
      return false;
    }
    if (cancellationStatus === "none" && row.cancellationStatus !== "") return false;
    return true;
  });

  const sheetRows = rows.map((row) => ({
    [HEADERS[0]]: sanitizeCell(row.registrationId),
    [HEADERS[1]]: formatDateTime(row.registeredAt),
    [HEADERS[2]]: sanitizeCell(row.parentName),
    [HEADERS[3]]: sanitizeCell(row.parentEmail),
    [HEADERS[4]]: sanitizeCell(row.parentPhone),
    [HEADERS[5]]: row.childName ? sanitizeCell(row.childName) : "",
    [HEADERS[6]]: formatDate(row.childDob),
    [HEADERS[7]]: row.childGrade ? sanitizeCell(row.childGrade) : "",
    [HEADERS[8]]: row.currentSchool ? sanitizeCell(row.currentSchool) : "",
    [HEADERS[9]]: sanitizeCell(row.programName),
    [HEADERS[10]]: sanitizeCell(
      [row.sessionLabel, row.sessionDateRange].filter(Boolean).join(" · ")
    ),
    [HEADERS[11]]: row.rateType ? RATE_TYPE_LABEL[row.rateType] : "",
    [HEADERS[12]]: row.rateType && row.sessionDateRange ? sanitizeCell(row.sessionDateRange) : "",
    [HEADERS[13]]: row.unitCount ?? "",
    [HEADERS[14]]: row.programLocation ? sanitizeCell(row.programLocation) : "",
    [HEADERS[15]]: row.amount,
    [HEADERS[16]]: PAYMENT_METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod,
    [HEADERS[17]]: row.paymentStatus,
    [HEADERS[18]]: row.registrationStatus,
    [HEADERS[19]]: row.cancellationStatus,
    [HEADERS[20]]: row.preferredResolution ? RESOLUTION_LABEL[row.preferredResolution] : "",
    [HEADERS[21]]: row.cancellationReason ? sanitizeCell(row.cancellationReason) : "",
    [HEADERS[22]]: formatDateTime(row.requestDate),
    [HEADERS[23]]: row.schoolLocation ? sanitizeCell(row.schoolLocation) : "",
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
