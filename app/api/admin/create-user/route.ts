import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  // 1) estrai token da header
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2) verifica token e ruolo
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  if (decoded.ruolo !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3) estrai payload e creazione utente
  try {
    const { email, password, nome, tipo, area, ruolo } = await req.json();

    const userRecord = await adminAuth.createUser({
      email, password, displayName: nome,
    });
    // imposta anche il custom claim "ruolo"
    await adminAuth.setCustomUserClaims(userRecord.uid, { ruolo });

    // salva profilo in Firestore
    await adminDb
      .collection('users')
      .doc(userRecord.uid)
      .set({
        uid:        userRecord.uid,
        email:      userRecord.email,
        nome,
        tipo,
        area,
        ruolo,
        createdAt:  FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ status: 'success', uid: userRecord.uid });
  } catch (e: any) {
    console.error('Create-user error:', e);
    return NextResponse.json({ error: e.message||'Unknown' }, { status: 400 });
  }
}