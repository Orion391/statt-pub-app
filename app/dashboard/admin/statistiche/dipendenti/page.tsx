// by Orion

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

interface Row {
  nome: string;
  tipo: 'dipendente fisso' | 'dipendente serata';
  importo: number;
  giorni: number; // da collezione “turni” in futuro
}

export default function DipendentiPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo]     = useState(today);

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let users: { nome: string; tipo: Row['tipo'] }[] = [];
    // 1) carica utenti
    (async () => {
      const snapU = await getDocs(collection(db, 'users'));
      snapU.forEach(d => {
        const u = d.data() as any;
        if (u.tipo === 'dipendente fisso' || u.tipo === 'dipendente serata') {
          users.push({ nome: u.nome, tipo: u.tipo });
        }
      });
      // inizializza rows con importo=0, giorni=0
      setRows(users.map(u => ({ ...u, importo: 0, giorni: 0 })));
    })();
  }, []);

  // 2) ascolta movimenti e somma importi per ciascun dipendente
  useEffect(() => {
    const start = Timestamp.fromDate(new Date(`${from}T00:00:00`));
    const end   = Timestamp.fromDate(new Date(`${to}T23:59:59`));
    const q = query(
      collection(db, 'movimenti'),
      where('tipo', '==', 'Spesa'),
      where('data', '>=', start),
      where('data', '<=', end)
    );
    const unsub = onSnapshot(q, snap => {
      // somma per nomeDipendente
      const agg: Record<string, number> = {};
      snap.docs.forEach(d => {
        const m = d.data() as any;
        if (m.dipendenteFisso) {
          agg[m.dipendenteFisso] = (agg[m.dipendenteFisso] || 0) + m.importo;
        }
      });
      // aggiorna le righe
      setRows(prev =>
        prev.map(r => ({
          ...r,
          importo: agg[r.nome] ?? 0,
          // giorni: ... lasciare a 0 finché non integrate la collezione turni
        }))
      );
    });
    return () => unsub();
  }, [from, to]);

  return (
    <main className="p-4 md:p-6 space-y-6">
      {/* back button + title */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin"
          className="text-orange-600 hover:underline flex items-center gap-1"
        >
          ← Torna alla Dashboard
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📊 Dipendenti
        </h1>
      </div>

      {/* Filtri date */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Da</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">A</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-orange-100">
            <tr>
              <th className="p-2">Nome</th>
              <th className="p-2">Tipo</th>
              <th className="p-2 text-right">Importo</th>
              <th className="p-2 text-center">Giorni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.nome} className="border-t hover:bg-gray-50">
                <td className="p-2">{r.nome}</td>
                <td className="p-2">{r.tipo === 'dipendente fisso' ? 'Fisso' : 'Serata'}</td>
                <td className="p-2 text-right">€ {r.importo.toFixed(2)}</td>
                <td className="p-2 text-center">{r.giorni}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}