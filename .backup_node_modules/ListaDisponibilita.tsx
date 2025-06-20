// by Orion

// components/ListaDisponibilita.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Disponibilita } from '@/lib/types';

export default function ListaDisponibilita() {
  const [listaSala, setListaSala] = useState<Disponibilita[]>([]);
  const [listaCucina, setListaCucina] = useState<Disponibilita[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'disponibilita'),
      snap => {
        const sala: Disponibilita[] = [];
        const cucina: Disponibilita[] = [];
        snap.docs.forEach(doc => {
          const data = doc.data() as Omit<Disponibilita, 'id'>;
          const item: Disponibilita = {
            id: doc.id,
            personale: data.personale,
            area:     data.area,
            day:      data.day,
          };
          if (data.area === 'Sala') sala.push(item);
          else cucina.push(item);
        });
        setListaSala(sala);
        setListaCucina(cucina);
      }
    );
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold mb-2">🍽️ Disponibilità Cucina</h2>
        {listaCucina.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna disponibilità in Cucina.</p>
        ) : (
          <ul className="space-y-1">
            {listaCucina.map(d => (
              <li key={d.id} className="p-2 bg-white rounded shadow flex justify-between">
                <span>{d.personale}</span>
                <span>{d.day.toDate().toLocaleDateString('it-IT')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">🍷 Disponibilità Sala</h2>
        {listaSala.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna disponibilità in Sala.</p>
        ) : (
          <ul className="space-y-1">
            {listaSala.map(d => (
              <li key={d.id} className="p-2 bg-white rounded shadow flex justify-between">
                <span>{d.personale}</span>
                <span>{d.day.toDate().toLocaleDateString('it-IT')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}