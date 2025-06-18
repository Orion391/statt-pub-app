// app/api/protected/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }
  // qui potresti anche verificare il ruolo se serve…
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/responsabile/:path*'],
};