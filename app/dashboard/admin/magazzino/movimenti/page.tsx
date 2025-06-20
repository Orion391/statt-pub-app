'use client';
import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface Articolo {
  id: string;
  nome: string;
  unita: string;
  area: 'Sala' | 'Cucina';
}

interface StockMovement {
  id: string;
  articolo: string;
  quantita: number;
  tipo: 'Ingresso' | 'Uscita' | 'In transito';
  data: Timestamp;
  area: 'Sala' | 'Cucina';
  archived?: boolean;
}

export default function MagMovimentiPage() {
  const router = useRouter();

  // aree selezionate
  const [selectedAreas, setSelectedAreas] = useState({ Sala: true, Cucina: true });

  // dati
  const [articoli, setArticoli] = useState<Articolo[]>([]);
  const [movimenti, setMovimenti] = useState<StockMovement[]>([]);

  // form nuovo
  const [articolo, setArticolo] = useState('');
  const [quantita, setQuantita] = useState(0);
  const [tipo, setTipo] = useState<'Ingresso'|'Uscita'|'In transito'>('Ingresso');
  const [data, setData] = useState(new Date().toISOString().slice(0,10));

  // modal “Ricevuto”
  const [showRicevutoModal, setShowRicevutoModal] = useState(false);
  const [ricevutoMovimento, setRicevutoMovimento] = useState<StockMovement|null>(null);
  const [ricevutoQty, setRicevutoQty] = useState(0);

  // 1) carica articoli
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db,'inventory'));
      setArticoli(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    })();
  }, []);

  // 2) sottoscrivi tutti i movimenti e poi filtro client-side
  useEffect(() => {
    const unsub = onSnapshot(collection(db,'stockMovements'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as StockMovement));
      setMovimenti(all.filter(m => !m.archived));
    });
    return () => unsub();
  }, []);

  // 3) submit nuovo movimento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articolo || quantita <= 0) {
      alert('Seleziona un articolo e inserisci una quantità valida');
      return;
    }
    await addDoc(collection(db,'stockMovements'), {
      articolo,
      quantita,
      tipo,
      data: Timestamp.fromDate(new Date(data)),
      area: articoli.find(a => a.nome === articolo)?.area || 'Sala',
      archived: false,
    });
    setArticolo(''); setQuantita(0); setTipo('Ingresso'); setData(new Date().toISOString().slice(0,10));
  };

  // 4) open modal ricevuto
  const openRicevutoModal = (m: StockMovement) => {
    setRicevutoMovimento(m);
    setRicevutoQty(m.quantita);
    setShowRicevutoModal(true);
  };

  // 5) conferma ricezione
  const handleConfirmRicevuto = async () => {
    if (!ricevutoMovimento) return;
    const ref = doc(db,'stockMovements',ricevutoMovimento.id);
    await updateDoc(ref, { tipo:'Ingresso', quantita: ricevutoQty });
    setShowRicevutoModal(false);
    setRicevutoMovimento(null);
  };

  // 6) archivia
  const handleArchive = async (m: StockMovement) => {
    if (!confirm('Archiviare questo movimento?')) return;
    const ref = doc(db,'stockMovements',m.id);
    await updateDoc(ref, { archived: true });
  };

  // filtraggio client-side per aree
  const displayed = movimenti.filter(m => selectedAreas[m.area]);

  return (
    <main className="p-6 space-y-6">
      <button
        onClick={() => router.push('/dashboard/admin/magazzino')}
        className="text-orange-600 hover:underline"
      >
        ← Torna al magazzino
      </button>

      {/* Selettori di area */}
      <div className="flex gap-4">
        {(['Sala','Cucina'] as const).map(a => (
          <label key={a} className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={selectedAreas[a]}
              onChange={() => setSelectedAreas(s => ({ ...s, [a]: !s[a] }))}
            />
            <span>{a}</span>
          </label>
        ))}
      </div>

      {/* Form Nuovo Movimento */}
      <section className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="font-semibold">Nuovo Movimento</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select
            className="border p-2 rounded"
            value={articolo}
            onChange={e => setArticolo(e.target.value)}
          >
            <option value="">Seleziona Articolo</option>
            {articoli
              .filter(a => selectedAreas[a.area])
              .map(a => (
                <option key={a.id} value={a.nome}>
                  {a.nome}
                </option>
              ))
            }
          </select>
          <input
            type="number" min="1"
            className="border p-2 rounded"
            placeholder="Quantità"
            value={quantita}
            onChange={e => setQuantita(+e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={tipo}
            onChange={e => setTipo(e.target.value as any)}
          >
            <option value="Ingresso">Ingresso</option>
            <option value="Uscita">Uscita</option>
            <option value="In transito">In transito</option>
          </select>
          <input
            type="date"
            className="border p-2 rounded"
            value={data}
            onChange={e => setData(e.target.value)}
          />
          <div className="sm:col-span-4 text-right">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Registra
            </button>
          </div>
        </form>
      </section>

      {/* Tabella Movimenti */}
      <section className="bg-white p-4 rounded shadow overflow-x-auto">
        <h2 className="font-semibold mb-2">Storico Movimenti</h2>
        <table className="w-full table-auto text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Articolo</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Q.tà</th>
              <th className="px-3 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length > 0 ? displayed.map(m => {
              const d = m.data.toDate().toLocaleDateString('it-IT');
              return (
                <tr key={m.id} className="border-b">
                  <td className="px-3 py-2">{d}</td>
                  <td className="px-3 py-2">{m.articolo}</td>
                  <td className="px-3 py-2">{m.tipo}</td>
                  <td className="px-3 py-2">{m.quantita}</td>
                  <td className="px-3 py-2 space-x-2">
                    {m.tipo === 'In transito' && (
                      <button
                        onClick={() => openRicevutoModal(m)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ricevuto
                      </button>
                    )}
                    {(m.tipo === 'Ingresso' || m.tipo === 'Uscita') && (
                      <button
                        onClick={() => handleArchive(m)}
                        className="text-gray-600 hover:underline text-sm"
                      >
                        Archivia
                      </button>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                  Nessun movimento
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal Ricevuto */}
      {showRicevutoModal && ricevutoMovimento && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">Conferma Ricezione</h3>
            <p><strong>Articolo:</strong> {ricevutoMovimento.articolo}</p>
            <p><strong>Quantità attesa:</strong> {ricevutoMovimento.quantita}</p>
            <div>
              <label className="block font-medium">Quantità effettiva ricevuta</label>
              <input
                type="number"
                min="1"
                className="w-full border rounded px-3 py-2"
                value={ricevutoQty}
                onChange={e => setRicevutoQty(+e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRicevutoModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmRicevuto}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}