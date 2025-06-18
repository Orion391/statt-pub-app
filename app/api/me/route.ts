// app/api/me/route.ts
import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // 1) recupera la collection dei cookies
    const cookieStore = await cookies()
    // 2) estrai il token
    const token = cookieStore.get('token')?.value
    if (!token) throw new Error('no token')

    // 3) verifica con Admin SDK
    const { uid } = await adminAuth.verifyIdToken(token)

    // 4) leggi il documento users/{uid}
    const snap = await adminDb.doc(`users/${uid}`).get()
    if (!snap.exists) throw new Error('user not found')

    const data = snap.data()!

    // 5) rispondi con i campi che servono ai dipendenti
    return NextResponse.json({
      nome: data.nome,
      ruolo: data.ruolo,
      area: data.area,
    })
  } catch {
    return NextResponse.json({ error: 'non autorizzato' }, { status: 401 })
  }
}