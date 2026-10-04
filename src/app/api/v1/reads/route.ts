import { logEvent } from "@/actions/log-event.action";
import { saveRead } from "@/actions/save-read.action";
import { BadRequest, OK, ServerError, Unauthorized } from "@/utils/response";
import { NextRequest } from "next/server";
import { isApiAuthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return handleRead(request);
}

export async function POST(request: NextRequest) {
  return handleRead(request);
}

export async function PUT(request: NextRequest) {
  return handleRead(request);
}

async function handleRead(request: NextRequest) {
  if (!isApiAuthorized(request)) {
    return Unauthorized();
  }
  
  let rfid: string | undefined;
  let id: string | undefined;
  let rssi: number;
  let datestamp: number;

  if (request.bodyUsed) {
    const json = await request.json();

    rfid = json["rfid"]?.trim();
    id = json["id"]?.trim();
    rssi = parseFloat(json["rssi"]?.trim() ?? "");
    datestamp = Date.parse(json["datestamp"]?.trim() ?? "");    
  } else {
    const params = request.nextUrl.searchParams;

    rfid = params.get("rfid")?.trim();
    id = params.get("id")?.trim();
    rssi = parseFloat(params.get("rssi")?.trim() ?? "");
    datestamp = Date.parse(params.get("datestamp")?.trim() ?? "");
  }

  const errors: string[] = [];
  if (!rfid) {
    errors.push('Missing query parameter: "rfid"'); 
  }
  if (!id) {
    errors.push('Missing query parameter: "id"'); 
  }
  if (isNaN(rssi)) {
    errors.push('Query parameter "rssi" is not valid'); 
  }

  if (errors.length > 0) {
    const errorLog = errors.join("\n");
    console.log(errorLog);
    await logRejectedRead(request, errorLog);
    return BadRequest(errors);
  }

  try {
    const { type, message } = await saveRead({
      epc: rfid!,
      readerId: id!,
      rssi: rssi,
      readerTimestamp: isNaN(datestamp) ? null : new Date(datestamp).toISOString(),
    });

    switch (type) {
      case "error":
        return ServerError(message);

      case "unknown_reader":
        const reason = `Unknown reader id "${id}"`;
        await logRejectedRead(request, reason + '\n' + message);
        return BadRequest([reason, message]);

      case "stored":
      case "heartbeat":
        return OK();
    }
  } catch (err) {
    return ServerError(err);
  }
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
      query: request.nextUrl.search,
      body: await request.json(),
    });
  } catch (err) {
    console.error("reads: ", err);
  }
}
