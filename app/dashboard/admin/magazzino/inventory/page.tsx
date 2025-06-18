// by Orion

// app/dashboard/admin/magazzino/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface Fornitore {
  id: string;
  nome: string;
}

interface Articolo {
  id: string;
  nome: string;
  descrizione: string;
  unita: string;
  giacenzaMin: number;
  fornitorePref: string;
  prezzoUnit: number;
  area: 'Sala' | 'Cucina';
}

export default function MagazzinoAdminPage() {
  const router = useRouter();

  // STATE FORNITORI
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  // STATE ARTICOLI
  const [articoli, setArticoli]   = useState<Articolo[]>([]);
  // FORM PER CREAZIONE/MODIFICA
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form, setForm] = useState<Omit<Articolo, 'id'>>({
    nome: '',
    descrizione: '',
    unita: '',
    giacenzaMin: 0,
    fornitorePref: '',
    prezzoUnit: 0,
    area: 'Sala',
  });
  const [loading, setLoading] = useState(false);

  // carica fornitori
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'fornitori'));
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setFornitori(list);
    })();
  }, []);

  // carica articoli
  const reloadArticoli = async () => {
    const snap = await getDocs(collection(db, 'inventory'));
    setArticoli(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };
  useEffect(() => { reloadArticoli() }, []);

  // gestori form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]:
        name === 'giacenzaMin' || name === 'prezzoUnit'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  // crea o aggiorna articolo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'inventory', editingId), form);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'inventory'), form);
      }
      await reloadArticoli();
      // reset
      setForm({
        nome: '',
        descrizione: '',
        unita: '',
        giacenzaMin: 0,
        fornitorePref: '',
        prezzoUnit: 0,
        area: 'Sala',
      });
    } finally {
      setLoading(false);
    }
  };

  // inizio modifica
  const startEdit = (a: Articolo) => {
    setEditingId(a.id);
    setForm({
      nome: a.nome,
      descrizione: a.descrizione,
      unita: a.unita,
      giacenzaMin: a.giacenzaMin,
      fornitorePref: a.fornitorePref,
      prezzoUnit: a.prezzoUnit,
      area: a.area,
    });
  };

  // elimina
  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo articolo?')) return;
    await deleteDoc(doc(db, 'inventory', id));
    setArticoli(articoli.filter(a => a.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 space-y-8">
      <button
        onClick={() => router.push('/dashboard/admin/magazzino')}
        className="text-orange-600 hover:underline"
      >
        ← Torna al Magazzino
      </button>

      {/* FORM CREA/MODIFICA */}
      <div className="max-w-lg mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">
          {editingId ? 'Modifica Articolo' : 'Nuovo Articolo'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block font-medium">Nome</label>
            <input
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Descrizione */}
          <div>
            <label className="block font-medium">Descrizione</label>
            <input
              name="descrizione"
              value={form.descrizione}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Unità */}
          <div>
            <label className="block font-medium">Unità di misura</label>
            <input
              name="unita"
              value={form.unita}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Giacenza minima */}
          <div>
            <label className="block font-medium">Giacenza minima</label>
            <input
              type="number"
              name="giacenzaMin"
              value={form.giacenzaMin}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Area */}
          <div>
            <label className="block font-medium">Area</label>
            <select
              name="area"
              value={form.area}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            >
              <option value="Sala">Sala</option>
              <option value="Cucina">Cucina</option>
            </select>
          </div>
          {/* Fornitore */}
          <div>
            <label className="block font-medium">Fornitore preferenziale</label>
            <select
              name="fornitorePref"
              value={form.fornitorePref}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            >
              <option value="">— Seleziona —</option>
              {fornitori.map(f => (
                <option key={f.id} value={f.nome}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          {/* Prezzo */}
          <div>
            <label className="block font-medium">Prezzo unitario (€)</label>
            <input
              type="number"
              step="0.01"
              name="prezzoUnit"
              value={form.prezzoUnit}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white ${
              loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading
              ? editingId
                ? 'Aggiornamento…'
                : 'Creazione…'
              : editingId
              ? 'Aggiorna'
              : 'Aggiungi'}
          </button>
        </form>
      </div>

      {/* TABELLA ANAGRAFICA */}
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Elenco Articoli</h2>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Unità</th>
              <th className="px-3 py-2">Giacenza Min</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Fornitore</th>
              <th className="px-3 py-2">Prezzo €</th>
              <th className="px-3 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {articoli.map(a => (
              <tr key={a.id} className="border-b">
                <td className="px-3 py-2">{a.nome}</td>
                <td className="px-3 py-2">{a.unita}</td>
                <td className="px-3 py-2">{a.giacenzaMin}</td>
                <td className="px-3 py-2">{a.area}</td>
                <td className="px-3 py-2">{a.fornitorePref}</td>
                <td className="px-3 py-2">€ {a.prezzoUnit.toFixed(2)}</td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {articoli.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-2 text-center text-gray-500">
                  Nessun articolo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}