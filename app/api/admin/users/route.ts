// pseudo-codice /app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  const snap = await adminDb.collection('users').get();
  const users = snap.docs.map(d => ({ uid: d.id, ...(d.data()) }));
  return NextResponse.json({ users });
}