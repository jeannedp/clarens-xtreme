import { NextResponse } from "next/server";

export function OK<T>(): NextResponse<T>;
export function OK<T>(content: T): NextResponse<T>;
export function OK<T>(content: string = 'OK') {
  return new NextResponse<T>(content, {
    status: 200,
    headers: {
      'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json',
    },
  });
}

export function BadRequest<T>(): NextResponse<T>;
export function BadRequest<T>(content: T): NextResponse<T>
export function BadRequest<T>(content: string = 'BadRequest') {
  return new NextResponse<T>(JSON.stringify(content), {
    status: 400,
    headers: {
      'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json',
    },
  });
}

export function Unauthorized<T>(): NextResponse<T>;
export function Unauthorized<T>(content: T): NextResponse<T>;
export function Unauthorized<T>(content: string = 'Unauthorized') {
  return new NextResponse<T>(JSON.stringify(content), {
    status: 401,
    headers: {
      'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json',
    },
  });
}

export function ServerError<T>(): NextResponse<T>;
export function ServerError<T>(content: T): NextResponse<T>;
export function ServerError<T>(content: string = 'Internal Server Error') {
  return new NextResponse<T>(JSON.stringify(content), {
    status: 500,
    headers: {
      'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json',
    },
  });
}
