import { NextResponse } from "next/server";

export function GET(_: Request) {
  return NextResponse.json({ success: true });
}