import { getDashboard } from "@/actions/get-dashboard.action";
import { isValidSession } from "@/lib/auth";
import {
  SessionExportRow,
  SummaryExportRow,
  sessionExportRows,
  summaryExportRows,
  toCsv,
} from "@/lib/export";
import { BadRequest, File, Unauthorized } from "@/utils/response";
import ExcelJS from "exceljs";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const SESSION_HEADERS = ["Device", "Reader", "Date", "Time", "Session end", "Signal", "Reads"];
const SUMMARY_HEADERS = ["Device", "Date", "Sessions"];

const sessionValues = (r: SessionExportRow) => [r.device, r.reader, r.date, r.time, r.sessionEnd, r.signal ?? "", r.reads];
const summaryValues = (r: SummaryExportRow) => [r.device, r.date, r.sessions];

interface ExportRequestBody {
  format: "csv" | "xlsx";
  dataset?: "sessions" | "summary";
  settingId?: string;
  from?: string;
  to?: string;
  deviceIds?: string[];
  deviceTypeIds?: string[];
  readerIds?: string[];
}

export async function POST(request: NextRequest) {
  const isAuthorized = await isValidSession(request);
  if (!isAuthorized) {
    return Unauthorized();
  }

  const body: ExportRequestBody = await request.json();
  const errors: string[] = [];
  
  if (body.format !== "csv" && body.format !== "xlsx") {
    errors.push('"format" must be "csv" or "xlsx"');
  }  
  if (body.dataset !== "sessions" && body.dataset !== "summary") {
    errors.push('"dataset" must be "sessions" or "summary"');
  }
  if (!body.settingId) {
    errors.push('"settingId" must be provided');
  }
  if (!body.from || !DAY_RE.test(body.from)) {
    errors.push('"from" must be a YYYY-MM-DD date');
  }
  if (!body.to || !DAY_RE.test(body.to)) {
    errors.push('"to" must be a YYYY-MM-DD date');
  }
  if (body.from && body.to && body.from > body.to) {
    errors.push('Invalid date range provided');
  }

  if (errors.length > 0) {
    console.log(errors.join("\n"));
    return BadRequest(errors);
  }

  const dataset = body.dataset === "summary" ? "summary" : "sessions";
  const from = body.from!;
  const to = body.to!;
  const dash = await getDashboard({
    settingId: body.settingId!,
    from,
    to,
    deviceIds: body.deviceIds?.length ? body.deviceIds : undefined,
    deviceTypeIds: body.deviceTypeIds?.length ? body.deviceTypeIds : undefined,
    readerIds: body.readerIds?.length ? body.readerIds : undefined,
  });
  const sessions = sessionExportRows(dash);
  const summary = summaryExportRows(dash);
  const stamp = from === to ? from : `${from}_${to}`;

  if (body.format === "csv") {
    const csv =
      body.dataset === "summary"
        ? toCsv(SUMMARY_HEADERS, summary.map(summaryValues))
        : toCsv(SESSION_HEADERS, sessions.map(sessionValues));
    return File(
      csv, // BOM so Excel opens UTF-8 correctly
      "text/csv; charset=utf-8",
      `osiris-technical-systems-${dataset}-${stamp}.csv`,
    );
  }

  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const sessionSheet = wb.addWorksheet("Session log");
  sessionSheet.addRow(SESSION_HEADERS);
  sessions.forEach((r) => sessionSheet.addRow(sessionValues(r)));
  autoSize(sessionSheet, SESSION_HEADERS.length);
  sessionSheet.getRow(1).font = { bold: true };

  const summarySheet = wb.addWorksheet("Per device per day");
  summarySheet.addRow(SUMMARY_HEADERS);
  summary.forEach((r) => summarySheet.addRow(summaryValues(r)));
  autoSize(summarySheet, SUMMARY_HEADERS.length);
  summarySheet.getRow(1).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  return File(
    buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    `osiris-technical-systems-sessions-${stamp}.xlsx`,
  );
}

function autoSize(sheet: ExcelJS.Worksheet, columnCount: number) {
  for (let c = 1; c <= columnCount; c++) {
    const col = sheet.getColumn(c);
    let width = 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      width = Math.max(width, String(cell.value ?? "").length + 2);
    });
    col.width = Math.min(width, 40);
  }
}
