// app/api/admin/create-user/route.ts
import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

async function checkAdmin(request: Request) {
  const token = request.headers.get('Authorization')?.split('Bearer ')[1]
  if (!token) throw new Error('Unauthenticated')
  const decoded = await adminAuth.verifyIdToken(token)
  if (decoded.ruolo !== 'admin') throw new Error('Forbidden')
}

export async function POST(request: Request) {
  try {
    await checkAdmin(request)      // ← protezione
    const { email, password, nome, tipo, area, ruolo } = await request.json()
    // ... resto del handler
  } catch (e: any) {
    const status = e.message === 'Forbidden' ? 403 : 401
    return NextResponse.json({ error: e.message }, { status })
  }
}