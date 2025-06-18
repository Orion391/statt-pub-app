// by Orion

// app/dashboard/profile/page.tsx
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

export default function ProfilePage() {
  const auth = getAuth();
  const [userName, setUserName] = useState<string>('');
  const [area, setArea] = useState<'Sala'|'Cucina'>('Sala');
  const [articoli, setArticoli] = useState<{ id:string; nome:string; area:'Sala'|'Cucina' }[]>([]);
  const [articolo, setArticolo] = useState<string>('');
  const [quantita, setQuantita] = useState<number>(1);

  // recupero utente
  useEffect(() => {
    onAuthStateChanged(auth, async u => {
      if (!u) return;
      // prendi il suo nome da users
      const snap = await getDocs(query(
        collection(db,'users'),
        where('email','==',u.email)
      ));
      const prof = snap.docs[0]?.data() as any;
      setUserName(prof?.nome || u.email!);
    });
  }, [auth]);

  // carico articoli per la sua area
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db,'inventory'));
      setArticoli(
        snap.docs
          .map(d => ({ id:d.id, ...(d.data() as any) }))
          .filter(a => a.area === area)
      );
    })();
  }, [area]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articolo || quantita < 1) {
      return alert('Seleziona un articolo e quantità valide');
    }
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
  };

  return (
    <main className="p-6 space-y-8">

      <section className="bg-white p-4 rounded shadow max-w-md mx-auto">
        <h2 className="font-semibold mb-4">Richiesta Magazzino</h2>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <label>
            Area
            <select
              className="w-full border p-2 rounded mb-2"
              value={area}
              onChange={e => setArea(e.target.value as any)}
            >
              <option value="Sala">Sala</option>
              <option value="Cucina">Cucina</option>
            </select>
          </label>

          <label>
            Articolo
            <select
              className="w-full border p-2 rounded mb-2"
              value={articolo}
              onChange={e => setArticolo(e.target.value)}
            >
              <option value="">Seleziona art.</option>
              {articoli.map(a => (
                <option key={a.id} value={a.nome}>{a.nome}</option>
              ))}
            </select>
          </label>

          <label>
            Quantità
            <input
              type="number"
              min={1}
              className="w-full border p-2 rounded mb-4"
              value={quantita}
              onChange={e => setQuantita(+e.target.value)}
            />
          </label>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Invia Richiesta
          </button>
        </form>
      </section>
    </main>
  );
}