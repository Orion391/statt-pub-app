// app/dashboard/admin/fornitori/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Fornitore {
  id: string;
  nome: string;
  referente?: string;
  telefono?: string;
  email?: string;
}

export default function GestioneFornitoriPage() {
  const router = useRouter();

  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form a oggetto
  const [form, setForm] = useState({
    nome: '',
    referente: '',
    telefono: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  // 1) Carica lista fornitori
  useEffect(() => {
    fetch('/api/admin/fornitori')
      .then(res => res.json())
      .then(data => setFornitori(data.fornitori || []))
      .catch(console.error);
  }, []);

  // 2) Submit (Crea o Aggiorna)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return alert('Inserisci un nome');
    setLoading(true);
    try {
      const url = editingId
        ? `/api/admin/fornitori?id=${editingId}`
        : '/api/admin/fornitori';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // aggiorna la lista in locale
      setFornitori(prev => {
        if (editingId) {
          return prev.map(f => f.id === editingId ? data.fornitore : f);
        } else {
          return [...prev, data.fornitore];
        }
      });
      // reset form
      setForm({ nome:'', referente:'', telefono:'', email:'' });
      setEditingId(null);
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3) elimina fornitore
  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo fornitore?')) return;
    try {
      const res = await fetch(`/api/admin/fornitori?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setFornitori(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
  };

  // 4) inizio modifica
  const startEdit = (f: Fornitore) => {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      referente: f.referente || '',
      telefono: f.telefono || '',
      email: f.email || '',
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 space-y-8">
      <button
        onClick={() => router.push('/dashboard/admin')}
        className="text-orange-600 hover:underline"
      >
        ← Torna alla Dashboard
      </button>

      {/* FORM CREA / MODIFICA */}
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">
          {editingId ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block font-medium">Nome Fornitore</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="w-full mt-1 border rounded px-3 py-2"
              disabled={loading}
              required
            />
          </div>
          {/* Referente */}
          <div>
            <label className="block font-medium">Referente</label>
            <input
              type="text"
              value={form.referente}
              onChange={e => setForm(f => ({ ...f, referente: e.target.value }))}
              className="w-full mt-1 border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Telefono */}
          <div>
            <label className="block font-medium">Telefono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              className="w-full mt-1 border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Email */}
          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full mt-1 border rounded px-3 py-2"
              disabled={loading}
            />
          </div>

          <div className="flex justify-between">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ nome:'', referente:'', telefono:'', email:'' });
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Annulla
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded ${
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
          </div>
        </form>
      </div>

      {/* TABELLA FORNITORI */}
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Elenco Fornitori</h2>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Referente</th>
              <th className="px-3 py-2 text-left">Telefono</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {fornitori.map(f => (
              <tr key={f.id} className="border-b">
                <td className="px-3 py-2">{f.nome}</td>
                <td className="px-3 py-2">{f.referente || '—'}</td>
                <td className="px-3 py-2">{f.telefono || '—'}</td>
                <td className="px-3 py-2">{f.email || '—'}</td>
                <td className="px-3 py-2 space-x-2">
                  <button
                    onClick={() => startEdit(f)}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {fornitori.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                  Nessun fornitore
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}