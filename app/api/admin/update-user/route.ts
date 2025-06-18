// app/api/admin/update-user/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  // 1) Estrai token da cookie (o header)
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // 2) Verifica il token e controlla il ruolo
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.ruolo !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3) Prendi uid dai query params (?uid=...)
    const url = new URL(req.url);
    const uid = url.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ error: 'Param "uid" mancante' }, { status: 400 });
    }

    // 4) Estrai i campi dal body
    const { email, password, nome, tipo, area, ruolo } = await req.json();

    // 5) Aggiorna in Firebase Auth
    const authUpdates: Record<string, any> = {};
    if (email)    authUpdates.email    = email;
    if (password) authUpdates.password = password;
    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(uid, authUpdates);
    }

    // 6) Aggiorna anche il custom claim "ruolo" se cambiasse
    if (ruolo) {
      await adminAuth.setCustomUserClaims(uid, { ruolo });
    }

    // 7) Aggiorna in Firestore
    const dbUpdates: Record<string, any> = {};
    if (email)  dbUpdates.email = email;
    if (nome)   dbUpdates.nome  = nome;
    if (tipo)   dbUpdates.tipo  = tipo;
    if (area)   dbUpdates.area  = area;
    if (ruolo)  dbUpdates.ruolo = ruolo;
    if (Object.keys(dbUpdates).length > 0) {
      await adminDb.collection('users').doc(uid).update(dbUpdates);
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Update-user error:', e);
    const status = e.code === 'auth/id-token-expired' ? 401 : 500;
    return NextResponse.json({ error: e.message || 'Errore sconosciuto' }, { status });
  }
}