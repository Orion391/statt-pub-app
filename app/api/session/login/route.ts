// app/api/session/login/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 giorni

  try {
    // 1) crea session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    // 2) verifica e preleva l'UID dal cookie
    const decoded = await adminAuth.verifySessionCookie(sessionCookie);
    // 3) prendi il ruolo dal profilo Firestore
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const ruolo = (userSnap.data()?.ruolo as string) || 'dipendente';

    // 4) costruisci la response, includendo il ruolo
    const res = NextResponse.json({ status: 'ok', ruolo });

    // 5) imposta il session cookie HttpOnly
    res.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   expiresIn / 1000,
      path:     '/',
      sameSite: 'strict',
    });
    // 6) imposta anche un cookie leggibile in JS con il ruolo
    res.cookies.set('role', ruolo, {
      httpOnly: false,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   expiresIn / 1000,
      path:     '/',
      sameSite: 'lax',
    });

    return res;
  } catch (e: any) {
    console.error('Could not create session cookie', e);
    return NextResponse.json({ error: 'Auth error' }, { status: 401 });
  }
}