// by Orion

// app/dashboard/admin/utenti/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  uid: string;
  email: string;
  nome: string;
  tipo: string;
  area: string;
  ruolo: string;
}

export default function GestioneUtentiPage() {
  const router = useRouter();

  // form dipendente
  const [form, setForm] = useState({
    email: '',
    password: '',
    nome: '',
    tipo: 'dipendente fisso',
    area: 'Sala',
    ruolo: 'dipendente',
  });
  const [loading, setLoading] = useState(false);

  // elenco utenti e UID in modifica
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUid, setEditingUid] = useState<string | null>(null);

  // caricamento iniziale utenti
  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => setUsers(data.users || []));
  }, []);

  // imposta modifica
  const startEdit = (u: UserProfile) => {
    setEditingUid(u.uid);
    setForm({
      email: u.email,
      password: '',
      nome: u.nome,
      tipo: u.tipo,
      area: u.area,
      ruolo: u.ruolo,
    });
  };

  // elimina utente
  const handleDelete = async (uid: string) => {
    if (!confirm('Eliminare questo utente?')) return;
    const res = await fetch(`/api/admin/delete-user?uid=${uid}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Errore durante l\'eliminazione');
    } else {
      setUsers(u => u.filter(x => x.uid !== uid));
    }
  };

  // gestore campi form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // submit creazione o aggiornamento
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingUid
        ? `/api/admin/update-user?uid=${editingUid}`
        : '/api/admin/create-user';
      const method = editingUid ? 'POST' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore');
      alert(editingUid ? 'Utente aggiornato!' : 'Utente creato!');
      // ricarica utenti
      const list = await fetch('/api/admin/users').then(r => r.json());
      setUsers(list.users || []);
      setForm({
        email: '',
        password: '',
        nome: '',
        tipo: 'dipendente fisso',
        area: 'Sala',
        ruolo: 'dipendente',
      });
      setEditingUid(null);
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 space-y-8">
      <button
        onClick={() => router.push('/dashboard/admin')}
        className="text-orange-600 hover:underline"
      >
        ← Torna alla Dashboard
      </button>

      {/* FORM CREAZIONE / MODIFICA UTENTE */}
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">
          {editingUid ? 'Modifica Utente' : 'Crea Nuovo Utente'}
        </h1>
        <form onSubmit={handleUserSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-1 border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Password */}
          <div>
            <label className="block font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full mt-1 border rounded px-3 py-2"
              disabled={loading}
              placeholder={editingUid ? 'Lascia vuoto per non cambiare' : ''}
              required={!editingUid}
            />
          </div>
          {/* Nome */}
          <div>
            <label className="block font-medium">Nome</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              className="w-full mt-1 border rounded px-3 py-2"
              disabled={loading}
            />
          </div>
          {/* Tipo / Area / Ruolo */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full mt-1 border rounded px-3 py-2"
                disabled={loading}
              >
                <option value="dipendente fisso">Dipendente Fisso</option>
                <option value="dipendente serata">Dipendente Serata</option>
                <option value="responsabile">Responsabile</option>
              </select>
            </div>
            <div>
              <label className="block font-medium">Area</label>
              <select
                name="area"
                value={form.area}
                onChange={handleChange}
                className="w-full mt-1 border rounded px-3 py-2"
                disabled={loading}
              >
                <option value="Sala">Sala</option>
                <option value="Cucina">Cucina</option>
              </select>
            </div>
            <div>
              <label className="block font-medium">Ruolo</label>
              <select
                name="ruolo"
                value={form.ruolo}
                onChange={handleChange}
                className="w-full mt-1 border rounded px-3 py-2"
                disabled={loading}
              >
                <option value="admin">Admin</option>
                <option value="responsabile">Responsabile</option>
                <option value="dipendente">Dipendente</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading
              ? editingUid
                ? 'Aggiornamento…'
                : 'Creazione…'
              : editingUid
              ? 'Aggiorna Utente'
              : 'Crea Utente'}
          </button>
        </form>
      </div>

      {/* TABELLA UTENTI */}
      <div className="bg-white p-6 rounded shadow overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Elenco Utenti</h2>
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="hidden sm:table-cell px-3 py-2">Email</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Area</th>
              <th className="hidden sm:table-cell px-3 py-2">Tipo</th>
              <th className="hidden sm:table-cell px-3 py-2">Ruolo</th>
              <th className="px-3 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.uid} className="border-b hover:bg-gray-50">
                <td className="hidden sm:table-cell px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.nome}</td>
                <td className="px-3 py-2">{u.area}</td>
                <td className="hidden sm:table-cell px-3 py-2">{u.tipo}</td>
                <td className="hidden sm:table-cell px-3 py-2">{u.ruolo}</td>
                <td className="px-3 py-2 flex space-x-2">
                  {/* Modifica */}
                  <button
                    onClick={() => startEdit(u)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    ✏️
                  </button>
                  {/* Elimina */}
                  <button
                    onClick={() => handleDelete(u.uid)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-2 text-center text-gray-500">
                  Nessun utente trovato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}