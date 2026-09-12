import { logEvent } from "@/actions/log-event.action";
import { saveRead } from "@/actions/save-read.action";
import { BadRequest, OK, ServerError, Unauthorized } from "@/utils/response";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return handleRead(request);
}

export async function POST(request: NextRequest) {
  return handleRead(request);
}

async function handleRead(request: NextRequest) {
  if (!isAuthorised(request)) {
    return Unauthorized();
  }

  const params = request.nextUrl.searchParams;
  const rfid = params.get("rfid")?.trim() ?? "";
  const id = params.get("id")?.trim() ?? null;
  const rssi = parseFloat(params.get("rssi")?.trim() ?? "");
  const datestamp = Date.parse(params.get("datestamp")?.trim() ?? "");

  const errors: string[] = [];
  if (!rfid) {
    errors.push('Missing query parameter: "rfid"');
  }
  if (!id) {
    errors.push('Missing query parameter: "id"');
  }

  if (Number.isNaN(rssi)) {    
    errors.push('Query parameter "rssi" is not valid');
  }

  if (errors.length > 0) {
    await logRejectedRead(request, errors.join("\n"));
    return BadRequest(errors);
  }

  try {
    const { type, message } = await saveRead({
      epc: rfid,
      readerId: id!,
      rssi: rssi,
      readerTimestamp: !datestamp ? null : new Date(datestamp).toISOString(),
    });

    switch (type) {
      case "error":
        return ServerError();

      case "unknown_reader":
        const reason = `Unknown reader id "${id}"`;
        await logRejectedRead(request, reason + '\n' + message);
        return BadRequest([reason, message]);

      case "stored":
      case "heartbeat":
        return OK();
    }
  } catch (err) {
    return ServerError();
  }
}

function isAuthorised(request: NextRequest): boolean {
  const header = request.headers.get("authorization") ?? "";
  const [ method, encryptedToken ] = header.split(' ');
  if (!method || method !== 'Basic') {
    return false;
  }

  const appUsername = process.env.INGEST_BASIC_AUTH_USER;
  const appPassword = process.env.INGEST_BASIC_AUTH_PASS;
  if (!appUsername || !appPassword) {
    return false;
  }

  const token = Buffer.from(encryptedToken, "base64").toString("utf8");
  const separator = token.indexOf(":");
  if (separator === -1) {
    return false;
  }

  const [ username, password ] = token.split(':');
  return username === appPassword && password === appPassword;
}

async function logRejectedRead(request: NextRequest, message: string) {
  try {
    const headers: Record<string, string> = {};    
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "authorization") {
        headers[key] = value;
      }
    });   

    await logEvent({
      type: 'error',
      source: '/api/v1/read',
      description: 'Failed to persist rejected read.\n' + message,
      headers,
      query: request.nextUrl.search
    })
  } catch (err) {
    console.error("reads: ", err);
  }
}
