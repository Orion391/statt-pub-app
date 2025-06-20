// app/dashboard/responsabile/movimenti/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Movimento {
  id: string;
  tipo: 'Spesa' | 'Incasso';
  categoria: string;
  importo: number;
  data: any;
  dipendenteFisso?: string;
  note?: string;
}

const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatData = (ts: any) => {
  if (ts.toDate) return ts.toDate().toLocaleDateString('it-IT');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('it-IT');
  return new Date(ts).toLocaleDateString('it-IT');
};

export default function MovimentiResponsabilePage() {
  // stati
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [dataFiltro, setDataFiltro] = useState(getTodayString());
  const [tipoFiltro, setTipoFiltro] = useState<'tutti' | 'Spesa' | 'Incasso'>('tutti');
  const [filterOpen, setFilterOpen] = useState(false);

  // form
  const [tipo, setTipo] = useState<'Spesa' | 'Incasso'>('Spesa');
  const [macroCategoria, setMacroCategoria] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fornitori, setFornitori] = useState<string[]>([]);
  const [dipendentiFissi, setDipendentiFissi] = useState<string[]>([]);
  const [dipendentiSerata, setDipendentiSerata] = useState<string[]>([]);
  const [nomeDipendente, setNomeDipendente] = useState('');
  const [importo, setImporto] = useState('');
  const [note, setNote] = useState('');
  const [dataForm, setDataForm] = useState(getTodayString());
  const [modificaId, setModificaId] = useState<string | null>(null);

  // dettaglio
  const [selected, setSelected] = useState<Movimento | null>(null);

  // carica movimenti + utenti + fornitori
  useEffect(() => {
    const q = query(collection(db, 'movimenti'), orderBy('data', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setMovimenti(snap.docs.map(d => ({ ...(d.data() as Movimento), id: d.id })));
    });
    (async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const fissi: string[] = [];
      const serataArr: string[] = [];
      usersSnap.forEach(d => {
        const u = d.data() as any;
        if (u.tipo === 'dipendente fisso') fissi.push(u.nome);
        if (u.tipo === 'dipendente serata') serataArr.push(u.nome);
      });
      setDipendentiFissi(fissi);
      setDipendentiSerata(serataArr);

      const fornSnap = await getDocs(collection(db, 'fornitori'));
      setFornitori(fornSnap.docs.map(d => (d.data() as any).nome));
    })();
    return () => unsub();
  }, []);

  // filtro
  const filtered = movimenti.filter(m => {
    if (tipoFiltro !== 'tutti' && m.tipo !== tipoFiltro) return false;
    const isoLocal = m.data.toDate
      ? m.data.toDate().toLocaleDateString('sv')
      : new Date(m.data.seconds * 1000).toLocaleDateString('sv');
    if (dataFiltro && isoLocal !== dataFiltro) return false;
    return true;
  });

  // reset form
  const resetForm = () => {
    setTipo('Spesa');
    setMacroCategoria('');
    setCategoria('');
    setNomeDipendente('');
    setImporto('');
    setNote('');
    setDataForm(getTodayString());
    setModificaId(null);
  };

  // submit (crea o aggiorna)
  const handleSubmit = async () => {
    if (!importo || (!categoria && !nomeDipendente)) {
      return alert('Compila tutti i campi');
    }
    const [y, m, d] = dataForm.split('-');
    const payload: any = {
      tipo,
      categoria:
        tipo === 'Spesa' && macroCategoria.includes('Dipendente')
          ? nomeDipendente
          : categoria,
      importo: parseFloat(importo),
      note,
      data: Timestamp.fromDate(new Date(+y, +m - 1, +d)),
      // RESPONSABILE non può verificare
    };
    if (modificaId) {
      await deleteDoc(doc(db, 'movimenti', modificaId));
    }
    await addDoc(collection(db, 'movimenti'), payload);
    resetForm();
  };

  // inizio modifica
  const startEdit = (m: Movimento) => {
    setModificaId(m.id);
    setTipo(m.tipo);
    if (m.dipendenteFisso) {
      setMacroCategoria('Dipendenti fissi');
      setNomeDipendente(m.dipendenteFisso);
      setCategoria('');
    } else if (fornitori.includes(m.categoria)) {
      setMacroCategoria('Fornitori');
      setCategoria(m.categoria);
      setNomeDipendente('');
    } else {
      setMacroCategoria('');
      setCategoria(m.categoria);
    }
    setImporto(m.importo.toString());
    setNote(m.note || '');
    setDataForm(m.data.toDate().toLocaleDateString('sv'));
  };

  // elimina
  const handleDelete = async (id: string) => {
    if (confirm('Eliminare questo movimento?')) {
      await deleteDoc(doc(db, 'movimenti', id));
    }
  };

  return (
    <main className="p-6">
      <Link href="/dashboard/responsabile" className="text-orange-600 hover:underline">
        ← Torna alla Dashboard
      </Link>

      {/* FORM */}
      <section className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {modificaId ? 'Modifica' : 'Aggiungi'} movimento
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value as any)}
            className="w-full border p-2 rounded"
          >
            <option>Spesa</option>
            <option>Incasso</option>
          </select>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={dataFiltro}
            onChange={e => setDataFiltro(e.target.value)}
          />
        </div>
        {tipo === 'Spesa' && (
          <select
            className="w-full border p-2 rounded mb-4"
            value={macroCategoria}
            onChange={e => {
              setMacroCategoria(e.target.value);
              setCategoria('');
              setNomeDipendente('');
            }}
          >
            <option value="">Macro categoria</option>
            <option>Fornitori</option>
            <option>Dipendenti fissi</option>
            <option>Dipendenti serata</option>
            <option>Altro</option>
          </select>
        )}
        {(tipo === 'Incasso' || macroCategoria === 'Fornitori') && (
          <select
            className="w-full border p-2 rounded mb-4"
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
          >
            <option value="">Categoria</option>
            {(tipo === 'Incasso' ? ['Contanti', 'POS', 'Domicili', 'Altro'] : fornitori).map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
        {macroCategoria.startsWith('Dipendenti') && (
          <select
            className="w-full border p-2 rounded mb-4"
            value={nomeDipendente}
            onChange={e => setNomeDipendente(e.target.value)}
          >
            <option value="">Seleziona dipendente</option>
            {(macroCategoria === 'Dipendenti fissi' ? dipendentiFissi : dipendentiSerata).map(n => (
              <option key={n}>{n}</option>
            ))}
          </select>
        )}
        <input
          type="number"
          placeholder="Importo"
          className="w-full border p-2 rounded mb-4"
          value={importo}
          onChange={e => setImporto(e.target.value)}
        />
        <input
          type="text"
          placeholder="Note"
          className="w-full border p-2 rounded mb-4"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="flex-1 bg-orange-500 text-white py-2 rounded">
            {modificaId ? 'Salva' : 'Aggiungi'}
          </button>
          {modificaId && (
            <button onClick={resetForm} className="flex-1 bg-gray-200 py-2 rounded">
              Annulla
            </button>
          )}
        </div>
      </section>

      {/* FILTRI DESKTOP */}
      <div className="hidden sm:flex gap-4 mb-4">
        <input
          type="date"
          className="border p-2 rounded"
          value={dataFiltro}
          onChange={e => setDataFiltro(e.target.value)}
        />
        {(['tutti', 'Spesa', 'Incasso'] as const).map(f => (
          <button
            key={f}
            onClick={() => setTipoFiltro(f)}
            className={`px-3 py-1 rounded-full border ${
              tipoFiltro === f ? 'bg-orange-500 text-white' : 'bg-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABELLA */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-orange-100">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Importo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr
                key={m.id}
                onClick={() => setSelected(m)}
                className="cursor-pointer hover:bg-gray-100 transition"
              >
                <td className="p-3">{formatData(m.data)}</td>
                <td className="p-3">{m.tipo}</td>
                <td className="p-3">{m.dipendenteFisso ?? m.categoria}</td>
                <td className="p-3 font-medium">€ {m.importo.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}