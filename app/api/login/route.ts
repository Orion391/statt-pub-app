import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    // prendi il ruolo da Firestore
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const role = userDoc.data()?.ruolo;

    const response = NextResponse.json({ status: 'success', role });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}