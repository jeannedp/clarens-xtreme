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

export function Created<T>(): NextResponse<T>;
export function Created<T>(content: T): NextResponse<T>;
export function Created<T>(content: string = 'Created') {
  return new NextResponse<T>(content && JSON.stringify(content), {
    status: 201,
    headers: {
      'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json',
    },
  });
}

export function NoContent(): NextResponse<void> {
  return new NextResponse<void>('No Content', { 
    status: 204,
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

export function Forbidden<T>(): NextResponse<T>;
export function Forbidden<T>(content: T): NextResponse<T>;
export function Forbidden<T>(content: string = 'Forbidden') {
  return new NextResponse<T>(JSON.stringify(content), {
    status: 403,
    headers: {
      'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json',
    },
  });
}

export function NotFound<T>(): NextResponse<T>;
export function NotFound<T>(content: T): NextResponse<T>;
export function NotFound<T>(content: string = 'NotFound') {
  return new NextResponse<T>(JSON.stringify(content), {
    status: 404,
    headers: {
      'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json',
    },
  });
}
