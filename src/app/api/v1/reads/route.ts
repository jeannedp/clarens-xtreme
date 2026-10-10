import { logEvent } from "@/actions/log-event.action";
import { saveRead } from "@/actions/save-read.action";
import { BadRequest, OK, ServerError, Unauthorized } from "@/utils/response";
import { NextRequest } from "next/server";
import { isApiAuthorized } from '@/lib/auth';

interface RequestModel {
  rfid: string | undefined;
  id: string | undefined;
  rssi: number;
  datestamp: number;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const rfid = params.get("rfid")?.trim();
  const id = params.get("id")?.trim();
  const rssi = parseFloat(params.get("rssi")?.trim() ?? "");``
  const datestamp = Date.parse(params.get("datestamp")?.trim() ?? "");

  return handleRead(request, { rfid, id, rssi, datestamp });
}

export async function POST(request: NextRequest) {
  const json = await request.json();
  
  const rfid = json["rfid"]?.trim();
  const id = json["id"]?.trim();
  const rssi = parseFloat(json["rssi"]?.trim() ?? "");
  const datestamp = Date.parse(json["datestamp"]?.trim() ?? "");

  return handleRead(request, { rfid, id, rssi, datestamp });
}

export async function PUT(request: NextRequest) {
  const json = await request.json();
  
  const rfid = json["rfid"]?.trim();
  const id = json["id"]?.trim();
  const rssi = parseFloat(json["rssi"]?.trim() ?? "");
  const datestamp = Date.parse(json["datestamp"]?.trim() ?? "");

  return handleRead(request, { rfid, id, rssi, datestamp });
}

async function handleRead(
  request: NextRequest, 
  { rfid, id, rssi, datestamp }: RequestModel
) {
  if (!isApiAuthorized(request)) {
    return Unauthorized();
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
    console.error(errorLog);
    await logReadEvent(request, errorLog);
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
        await logReadEvent(request, message ?? 'Internal Server Error');
        return ServerError(message);

      case "unknown_reader":
      case "unknown_device":
        await logReadEvent(request, message);
        return BadRequest(message);

      case "stored":
      case "heartbeat":
        return OK();
    }
  } catch (err) {
    return ServerError(err);
  }
}

async function logReadEvent(request: NextRequest, message: string) {
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
