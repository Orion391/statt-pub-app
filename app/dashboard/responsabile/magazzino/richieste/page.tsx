// app/dashboard/responsabile/magazzino/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

export default function RespMagazzinoPage() {
  const router = useRouter();
  const auth = getAuth();

  const [userName, setUserName] = useState<string>('');
  const [area, setArea] = useState<'Sala'|'Cucina'>('Sala');
  const [articoli, setArticoli] = useState<{ id:string; nome:string; area:'Sala'|'Cucina' }[]>([]);
  const [articolo, setArticolo] = useState<string>('');
  const [quantita, setQuantita] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // 1) Recupera nome utente
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) return router.replace('/');
      const snap = await getDocs(query(
        collection(db,'users'),
        where('email','==',user.email)
      ));
      const prof = snap.docs[0]?.data() as any;
      setUserName(prof?.nome || user.email!);
    });
    return () => unsub();
  }, [auth, router]);

  // 2) Carica articoli della area selezionata
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db,'inventory'));
      const all = snap.docs.map(d => ({ id:d.id, ...(d.data() as any) }));
      setArticoli(all.filter(a => a.area === area));
    })();
  }, [area]);

  // 3) Invia richiesta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articolo || quantita < 1) {
      return alert('Seleziona un articolo e quantità valide');
    }
    setLoading(true);
    try {
      await addDoc(collection(db,'requisitions'), {
        articolo,
        quantita,
        area,
        richiedente: userName,
        data: Timestamp.now(),
        stato: 'pending'
      });
      setArticolo('');
      setQuantita(1);
      alert('Richiesta inviata!');
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'invio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 space-y-6">
      <button
        onClick={() => router.push('/dashboard/responsabile/magazzino')}
        className="text-orange-600 hover:underline"
      >
        ← Torna al magazzino
      </button>

      <section className="bg-white p-6 rounded shadow max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Richiesta Magazzino</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Area</label>
            <select
              value={area}
              onChange={e => setArea(e.target.value as any)}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            >
              <option value="Sala">Sala</option>
              <option value="Cucina">Cucina</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Articolo</label>
            <select
              value={articolo}
              onChange={e => setArticolo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            >
              <option value="">Seleziona articolo…</option>
              {articoli.map(a => (
                <option key={a.id} value={a.nome}>{a.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Quantità</label>
            <input
              type="number"
              min={1}
              value={quantita}
              onChange={e => setQuantita(+e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Invio in corso…' : 'Invia Richiesta'}
          </button>
        </form>
      </section>
    </main>
  );
}