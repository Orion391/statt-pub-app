// app/dashboard/admin/magazzino/report/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { 
  collection, getDocs, query, where, onSnapshot, Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface Articolo {
  id: string;
  nome: string;
  unita: string;
  giacenza: number;
  giacenzaMin: number;
  area: 'Sala' | 'Cucina';
}

interface StockMovement {
  id: string;
  articolo: string;
  tipo: 'Ingresso' | 'Uscita' | 'In transito';
  quantita: number;
  data: Timestamp;
  area: 'Sala' | 'Cucina';
}

export default function ReportMagazzinoPage() {
  const router = useRouter();

  // dati
  const [inventario, setInventario] = useState<Articolo[]>([]);
  const [ordiniArrivo, setOrdiniArrivo] = useState<StockMovement[]>([]);
  const [movimentiArchiviati, setMovimentiArchiviati] = useState<StockMovement[]>([]);

  // filtro temporale
  const [fromArrivo, setFromArrivo] = useState('');
  const [toArrivo, setToArrivo]     = useState('');
  const [fromStorico, setFromStorico] = useState('');
  const [toStorico, setToStorico]     = useState('');

  // tab attiva
  const tabs = ['Inventario', 'In Arrivo', 'Storico'] as const;
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Inventario');

  // helper per range
  const inRange = (ts: Timestamp, from?: string, to?: string) => {
    const d = ts.toDate();
    if (from && d < new Date(from)) return false;
    if (to) {
      const t = new Date(to); t.setHours(23,59,59);
      if (d > t) return false;
    }
    return true;
  };

  // 1) inventario
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'inventory'));
      const byName: Record<string, Articolo> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        byName[data.nome] = {
          id: d.id,
          nome: data.nome,
          unita: data.unita,
          giacenza: 0,
          giacenzaMin: data.giacenzaMin,
          area: data.area
        };
      });
      const movSnap = await getDocs(collection(db, 'stockMovements'));
      movSnap.docs.forEach(d => {
        const m = d.data() as any;
        if (m.tipo === 'In transito') return;
        const art = byName[m.articolo];
        if (!art) return;
        art.giacenza += m.tipo === 'Ingresso' ? m.quantita : -m.quantita;
      });
      setInventario(Object.values(byName));
    })();
  }, []);

  // 2) ordini in transito
  useEffect(() => {
    const q = query(collection(db, 'stockMovements'), where('tipo', '==', 'In transito'));
    return onSnapshot(q, snap => {
      setOrdiniArrivo(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
  }, []);

  // 3) movimenti storici
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'stockMovements'));
      setMovimentiArchiviati(
        snap.docs
          .map(d => ({ id: d.id, ...(d.data() as any) }))
          .filter(m => m.tipo !== 'In transito')
      );
    })();
  }, []);

  // dati filtrati
  const ordiniFiltrati   = ordiniArrivo.filter(m => inRange(m.data, fromArrivo, toArrivo));
  const storicoFiltrato = movimentiArchiviati.filter(m => inRange(m.data, fromStorico, toStorico));

  return (
    <main className="p-6 space-y-8">
      <button onClick={() => router.push('/dashboard/admin/magazzino')} className="text-orange-600 hover:underline">
        ← Torna al magazzino
      </button>

      {/* TABS */}
      <div className="flex gap-4 mb-4">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded ${
              activeTab === t ? 'bg-orange-500 text-white' : 'bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contenuti */}
      {activeTab === 'Inventario' && (
        <section className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Inventario Corrente</h2>
          <table className="w-full table-auto text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2">Articolo</th>
                <th className="px-3 py-2">Unità</th>
                <th className="px-3 py-2">Giacenza</th>
                <th className="px-3 py-2">Soglia Minima</th>
                <th className="px-3 py-2">Area</th>
              </tr>
            </thead>
            <tbody>
              {inventario.map(a => (
                <tr key={a.id} className={`border-b ${a.giacenza < a.giacenzaMin ? 'bg-red-100' : ''}`}>
                  <td className="px-3 py-2">{a.nome}</td>
                  <td className="px-3 py-2">{a.unita}</td>
                  <td className="px-3 py-2">{a.giacenza}</td>
                  <td className="px-3 py-2">{a.giacenzaMin}</td>
                  <td className="px-3 py-2">{a.area}</td>
                </tr>
              ))}
              {!inventario.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                    Inventario vuoto
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'In Arrivo' && (
        <section className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">Ordini In Arrivo</h2>
          <div className="flex gap-4 mb-2">
            <label>
              Da:{' '}
              <input
                type="date"
                value={fromArrivo}
                onChange={e => setFromArrivo(e.target.value)}
                className="border rounded p-1"
              />
            </label>
            <label>
              A:{' '}
              <input
                type="date"
                value={toArrivo}
                onChange={e => setToArrivo(e.target.value)}
                className="border rounded p-1"
              />
            </label>
          </div>
          <table className="w-full table-auto text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2">Articolo</th>
                <th className="px-3 py-2">Q.tà</th>
                <th className="px-3 py-2">Data Ordine</th>
                <th className="px-3 py-2">Area</th>
              </tr>
            </thead>
            <tbody>
              {ordiniFiltrati.map(m => (
                <tr key={m.id} className="border-b">
                  <td className="px-3 py-2">{m.articolo}</td>
                  <td className="px-3 py-2">{m.quantita}</td>
                  <td className="px-3 py-2">{m.data.toDate().toLocaleDateString('it-IT')}</td>
                  <td className="px-3 py-2">{m.area}</td>
                </tr>
              ))}
              {!ordiniFiltrati.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
                    Nessun ordine in transito
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'Storico' && (
        <section className="bg-white p-4 rounded shadow space-y-4">
          <h2 className="text-xl font-semibold">Storico Movimenti</h2>
          <div className="flex gap-4 mb-2">
            <label>
              Da:{' '}
              <input
                type="date"
                value={fromStorico}
                onChange={e => setFromStorico(e.target.value)}
                className="border rounded p-1"
              />
            </label>
            <label>
              A:{' '}
              <input
                type="date"
                value={toStorico}
                onChange={e => setToStorico(e.target.value)}
                className="border rounded p-1"
              />
            </label>
          </div>
          <table className="w-full table-auto text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Articolo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Q.tà</th>
                <th className="px-3 py-2">Area</th>
              </tr>
            </thead>
            <tbody>
              {storicoFiltrato.map(m => (
                <tr key={m.id} className="border-b">
                  <td className="px-3 py-2">{m.data.toDate().toLocaleDateString('it-IT')}</td>
                  <td className="px-3 py-2">{m.articolo}</td>
                  <td className="px-3 py-2">{m.tipo}</td>
                  <td className="px-3 py-2">{m.quantita}</td>
                  <td className="px-3 py-2">{m.area}</td>
                </tr>
              ))}
              {!storicoFiltrato.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                    Nessun movimento storico
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}