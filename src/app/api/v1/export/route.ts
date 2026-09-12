import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getDashboard } from "@/actions/get-dashboard.action";
import { DASHBOARD_COOKIE, isValidSession } from "@/lib/auth";
import {
  SessionExportRow,
  SummaryExportRow,
  sessionExportRows,
  summaryExportRows,
  toCsv,
} from "@/lib/export";
import { siteToday } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const SESSION_HEADERS = ["Gear", "Reader", "Date", "Time", "Session end", "Signal", "Reads"];
const SUMMARY_HEADERS = ["Gear", "Date", "Rides"];

const sessionValues = (r: SessionExportRow) => [r.gear, r.reader, r.date, r.time, r.sessionEnd, r.signal ?? "", r.reads];
const summaryValues = (r: SummaryExportRow) => [r.gear, r.date, r.rides];

interface ExportRequestBody {
  format: "csv" | "xlsx";
  dataset?: "sessions" | "summary";
  from?: string;
  to?: string;
}

export async function POST(request: NextRequest) {
  if (!(await isValidSession(request.cookies.get(DASHBOARD_COOKIE)?.value))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: ExportRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (body.format !== "csv" && body.format !== "xlsx") {
    return new Response('"format" must be "csv" or "xlsx"', { status: 400 });
  }

  const today = siteToday();
  const from = body.from && DAY_RE.test(body.from) ? body.from : today;
  const to = body.to && DAY_RE.test(body.to) ? body.to : today;
  const dataset = body.dataset === "summary" ? "summary" : "sessions";

  const dash = await getDashboard({ from, to });
  const sessions = sessionExportRows(dash);
  const summary = summaryExportRows(dash);
  const stamp = from === to ? from : `${from}_${to}`;

  if (body.format === "csv") {
    const csv =
      dataset === "summary"
        ? toCsv(SUMMARY_HEADERS, summary.map(summaryValues))
        : toCsv(SESSION_HEADERS, sessions.map(sessionValues));
    return fileResponse(
      `﻿${csv}`, // BOM so Excel opens UTF-8 correctly
      "text/csv; charset=utf-8",
      `clarens-xtreme-${dataset}-${stamp}.csv`,
    );
  }

  const wb = new ExcelJS.Workbook();
  wb.created = new Date();

  const sessionSheet = wb.addWorksheet("Session log");
  sessionSheet.addRow(SESSION_HEADERS);
  sessions.forEach((r) => sessionSheet.addRow(sessionValues(r)));
  autoSize(sessionSheet, SESSION_HEADERS.length);
  sessionSheet.getRow(1).font = { bold: true };

  const summarySheet = wb.addWorksheet("Per gear per day");
  summarySheet.addRow(SUMMARY_HEADERS);
  summary.forEach((r) => summarySheet.addRow(summaryValues(r)));
  autoSize(summarySheet, SUMMARY_HEADERS.length);
  summarySheet.getRow(1).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  return fileResponse(
    buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    `clarens-xtreme-rides-${stamp}.xlsx`,
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

function fileResponse(body: string | ArrayBuffer, contentType: string, filename: string) {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
