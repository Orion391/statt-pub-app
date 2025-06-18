// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ADMIN = /^\/dashboard\/admin(\/|$)/;

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const path = nextUrl.pathname;

  // Se sto cercando di entrare in /dashboard/admin/*
  if (PROTECTED_ADMIN.test(path)) {
    const role = cookies.get('role')?.value;
    // se non sono admin, reindirizzo al mio dashboard
    if (role !== 'admin') {
      // scegli fallback in base al ruolo
      const dest = role === 'responsabile'
        ? '/dashboard/responsabile'
        : '/dashboard/dipendente';
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }

  // per tutte le altre richieste, lascio passare
  return NextResponse.next();
}

export const config = {
  // Applica la middleware solo a /dashboard/admin/*
  matcher: ['/dashboard/admin/:path*'],
};