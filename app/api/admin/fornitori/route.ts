// app/api/admin/fornitori/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const COL = 'fornitori';

interface FornitoreData {
  nome: string;
  referente?: string;
  telefono?: string;
  email?: string;
}

export async function GET() {
  try {
    const snap = await adminDb.collection(COL).orderBy('nome').get();
    const fornitori = snap.docs.map(d => ({ id: d.id, ...(d.data() as FornitoreData) }));
    return NextResponse.json({ fornitori });
  } catch (e: any) {
    console.error('GET fornitori error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { nome, referente, telefono, email } = (await request.json()) as FornitoreData;
    if (!nome) {
      return NextResponse.json({ error: 'Nome invalido' }, { status: 400 });
    }
    const ref = await adminDb.collection(COL).add({ nome, referente, telefono, email });
    const snap = await ref.get();
    return NextResponse.json({ fornitore: { id: ref.id, ...(snap.data() as FornitoreData) } });
  } catch (e: any) {
    console.error('POST fornitori error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    const { nome, referente, telefono, email } = (await request.json()) as FornitoreData;
    if (!nome) {
      return NextResponse.json({ error: 'Nome invalido' }, { status: 400 });
    }

    const docRef = adminDb.collection(COL).doc(id);
    await docRef.update({ nome, referente, telefono, email });
    const snap = await docRef.get();
    return NextResponse.json({ fornitore: { id, ...(snap.data() as FornitoreData) } });
  } catch (e: any) {
    console.error('PUT fornitori error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    await adminDb.collection(COL).doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('DELETE fornitori error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}