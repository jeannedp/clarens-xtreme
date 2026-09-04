import { saveDeviceEvent } from "@/actions/save-device-event.action";
import { BadRequest, OK, Unauthorized } from "@/utils/response";
import { CookieStoreType } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  
  if (!authorization) {
    return Unauthorized();
  }

  // Check against registered devices
  // return Unauthorized();
  
  const queryParams = request.nextUrl.searchParams;
  const rfid = queryParams.get('rfid')
  const rssi = queryParams.get('rssi')
  const datestamp = queryParams.get('datestamp')
  const id = queryParams.get('id')
  const errors = [];

  if (!rfid || rfid === '') {
    errors.push('Mising query parameter: "rfid"');
  }

  if (!rssi || rssi === '') {
    errors.push('Mising query parameter: "rssi"');
  }

  if (!datestamp || datestamp === '') {
    errors.push('Mising query parameter: "datestamp"');
  }

  if (!id || id === '') {
    errors.push('Mising query parameter: "id"');
  }

  if (errors.length > 0) {
    return BadRequest(errors);
  }


  const success = await saveDeviceEvent({
    rfid: rfid!,
    rssi: parseFloat(rssi!),
    datestamp: datestamp!,
    id: id!
  }, request.cookies as any as CookieStoreType);

  return success ? OK() : BadRequest();
}
