'use client';

import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface Props { children: ReactNode; }

export default function DipendenteLayout({ children }: Props) {
  const [nome, setNome] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.replace('/');   // torna al login
        return;
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      setNome(snap.exists() ? (snap.data() as any).nome : '—');
    });
    return () => unsub();
  }, [router]);

  if (nome === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-lg text-gray-500">Caricamento…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between bg-white shadow px-6 py-4">
        <div className="flex items-center space-x-3">
          <Image src="/logo-statt.png" width={32} height={32} alt="GeStatt" />
          <span className="text-xl font-bold">GeStatt</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">👋🏻 Ciao <strong>{nome}</strong></span>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">
        {children}
      </main>
      <button
        onClick={() => signOut(auth).then(() => router.replace('/'))}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full shadow hover:bg-red-200 transition"
      >
        Logout
      </button>
    </div>
  );
}