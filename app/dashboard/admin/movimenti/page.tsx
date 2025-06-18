// by Orion

'use client';
import { useState, useEffect } from 'react';
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
import Link from 'next/link';

interface Movimento {
  id: string;
  tipo: 'Spesa' | 'Incasso';
  categoria: string;
  importo: number;
  data: any;
  dipendenteFisso?: string;
  note?: string;
  verificato?: boolean;
}

const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getOneMonthAgoString = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
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

export default function MovimentiPage() {
  // stati
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [startDate, setStartDate] = useState(getOneMonthAgoString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [tipoFiltro, setTipoFiltro] = useState<'tutti' | 'Spesa' | 'Incasso'>('tutti');
  const [filterOpen, setFilterOpen] = useState(false);

  // form ...
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

  // dettaglio modal
  const [selected, setSelected] = useState<Movimento | null>(null);

  // raggruppo per data
  const grouped: Record<string, Movimento[]> = {};

  const filtered = movimenti.filter(m => {
    // filtro tipo
    if (tipoFiltro !== 'tutti' && m.tipo !== tipoFiltro) return false;
    // filtro data range
    const dateISO = m.data.toDate
      ? m.data.toDate().toISOString().slice(0, 10)
      : new Date(m.data.seconds * 1000).toISOString().slice(0, 10);
    if (dateISO < startDate || dateISO > endDate) return false;
    return true;
  });
  filtered.forEach(m => {
    const d = formatData(m.data);
    (grouped[d] ||= []).push(m);
  });

  useEffect(() => {
    // movimenti
    const q = query(collection(db, 'movimenti'), orderBy('data', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setMovimenti(snap.docs.map(d => ({ ...(d.data() as Movimento), id: d.id })));
    });
    // lookup utenti/fornitori
    (async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const f: string[] = [], s: string[] = [];
      usersSnap.forEach(d => {
        const u = d.data() as any;
        if (u.tipo === 'dipendente fisso') f.push(u.nome);
        if (u.tipo === 'dipendente serata') s.push(u.nome);
      });
      setDipendentiFissi(f);
      setDipendentiSerata(s);
      const fornSnap = await getDocs(collection(db, 'fornitori'));
      setFornitori(fornSnap.docs.map(d => (d.data() as any).nome));
    })();
    return () => unsub();
  }, []);

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

  const handleSubmit = async () => {
    if (!importo || (!categoria && !nomeDipendente)) return alert('Compila tutti i campi');
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
      verificato: false,
    };
    if (modificaId) await deleteDoc(doc(db, 'movimenti', modificaId));
    await addDoc(collection(db, 'movimenti'), payload);
    resetForm();
  };

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
    const iso = m.data.toDate
      ? m.data.toDate().toISOString().slice(0, 10)
      : new Date(m.data.seconds * 1000).toISOString().slice(0, 10);
    setDataForm(iso);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo movimento?')) return;
    await deleteDoc(doc(db, 'movimenti', id));
  };

  const handleApprove = async (m: Movimento) => {
    await updateDoc(doc(db, 'movimenti', m.id), { verificato: true });
    setSelected({ ...m, verificato: true });
  };

  return (
    <main className="p-6">
      <Link href="/dashboard/admin" className="text-orange-600 hover:underline">
        ← Torna alla Dashboard
      </Link>

      {/* FORM */}
{/* FORM AGGIUNGI/MODIFICA */}
<section className="bg-white p-6 rounded-xl shadow mb-6">
  <h2 className="text-lg font-semibold mb-4">
    {modificaId ? 'Modifica' : 'Aggiungi'} movimento
  </h2>

  <div className="grid gap-4 sm:grid-cols-2 mb-4">
    {/* Tipo e Data */}
    <select
      value={tipo}
      onChange={e => { setTipo(e.target.value as any); }}
      className="w-full border p-2 rounded"
    >
      <option>Spesa</option>
      <option>Incasso</option>
    </select>
    <input
      type="date"
      className="w-full border p-2 rounded"
      value={dataForm}
      onChange={e => setDataForm(e.target.value)}
    />
  </div>

  {/* Macro‐Categoria (solo per Spesa) */}
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

  {/* Categoria */}
  {(tipo === 'Incasso' || macroCategoria === 'Fornitori' || macroCategoria === 'Altro') && (
    <select
      className="w-full border p-2 rounded mb-4"
      value={categoria}
      onChange={e => setCategoria(e.target.value)}
    >
      <option value="">Categoria</option>
      {(tipo === 'Incasso'
        ? ['Contanti', 'POS', 'Domicili', 'Altro']
        : fornitori
      ).map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )}

  {/* Seleziona dipendente (solo per Dipendenti fissi/serata) */}
  {macroCategoria === 'Dipendenti fissi' && (
    <select
      className="w-full border p-2 rounded mb-4"
      value={nomeDipendente}
      onChange={e => setNomeDipendente(e.target.value)}
    >
      <option value="">Seleziona dipendente fisso</option>
      {dipendentiFissi.map(n => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  )}
  {macroCategoria === 'Dipendenti serata' && (
    <select
      className="w-full border p-2 rounded mb-4"
      value={nomeDipendente}
      onChange={e => setNomeDipendente(e.target.value)}
    >
      <option value="">Seleziona dipendente serata</option>
      {dipendentiSerata.map(n => (
        <option key={n} value={n}>{n}</option>
      ))}
    </select>
  )}

  {/* Importo & Note */}
  <input
    type="number"
    step="0.01"
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

  {/* Pulsanti */}
  <div className="flex gap-2">
    <button
      onClick={handleSubmit}
      className="flex-1 bg-orange-500 text-white py-2 rounded"
    >
      {modificaId ? 'Salva' : 'Aggiungi'}
    </button>
    {modificaId && (
      <button
        onClick={resetForm}
        className="flex-1 bg-gray-200 py-2 rounded"
      >
        Annulla
      </button>
    )}
  </div>
</section>

      {/* FILTRI */}
      <button
        className="relative z-10 sm:hidden bg-gray-200 p-2 rounded mb-4 w-full"
        onClick={() => setFilterOpen(true)}
      >
        ⚙️ Filtri
      </button>
      <div className="hidden sm:flex gap-4 mb-4">
        <input
          type="date"
          className="border p-2 rounded"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
        {['tutti', 'Spesa', 'Incasso'].map(f => (
          <button
            key={f}
            onClick={() => setTipoFiltro(f as any)}
            className={`px-3 py-1 rounded-full border ${
              tipoFiltro === f ? 'bg-orange-500 text-white' : 'bg-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Modal Filtri Mobile */}
      {filterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white w-full max-w-sm p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-bold">Filtri</h3>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
            <div className="flex gap-2">
              {['tutti', 'Spesa', 'Incasso'].map(f => (
                <button
                  key={f}
                  onClick={() => setTipoFiltro(f as any)}
                  className={`flex-1 py-2 rounded border ${
                    tipoFiltro === f ? 'bg-orange-500 text-white' : 'bg-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFilterOpen(false)}
              className="w-full bg-orange-500 text-white py-2 rounded"
            >
              Salva
            </button>
          </div>
        </div>
      )}

<div className="bg-white rounded-lg shadow overflow-hidden mb-6">
  {Object.entries(grouped).map(([date, items]) => (
    <div key={date} className="border-b last:border-0">
      <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">
        {date}
      </div>
      <table className="w-full table-auto">
        <tbody>
          {items.map(m => (
            <tr
              key={m.id}
              className={`group hover:bg-gray-50 transition ${
                m.verificato ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {/* Tipo + importo su mobile */}
              <td className="flex items-center px-4 py-3 space-x-2 sm:table-cell sm:px-6 sm:py-3">
                <span className="font-medium">{m.tipo}</span>
                <span className="text-gray-600 sm:hidden">— €{m.importo.toFixed(2)}</span>
              </td>
              {/* Categoria */}
              <td className="hidden sm:table-cell px-6 py-3">
                {m.dipendenteFisso ?? m.categoria}
              </td>
              {/* Importo */}
              <td className="hidden sm:table-cell px-6 py-3 font-medium ">
                € {m.importo.toFixed(2)}
              </td>
              {/* Azioni */}
              <td className="px-4 py-3 flex space-x-3 justify-end">
                {!m.verificato && (
                  <button
                    onClick={() => handleApprove(m)}
                    className="text-green-600 hover:text-green-800"
                    title="Approva"
                  >
                    ✅
                  </button>
                )}
                <button
                  onClick={() => startEdit(m)}
                  className="text-orange-600 hover:text-orange-800"
                  title="Modifica"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setSelected(m)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Dettagli"
                >
                  ℹ️
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Elimina"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ))}
  {filtered.length === 0 && (
    <div className="p-6 text-center text-gray-500">Nessun movimento</div>
  )}
</div>

      {/* MODAL DETTAGLI */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">Dettagli Movimento</h3>
            <p><strong>Data:</strong> {formatData(selected.data)}</p>
            <p><strong>Tipo:</strong> {selected.tipo}</p>
            <p><strong>Categoria:</strong> {selected.dipendenteFisso ?? selected.categoria}</p>
            <p><strong>Importo:</strong> € {selected.importo.toFixed(2)}</p>
            {selected.note && <p><strong>Note:</strong> {selected.note}</p>}
            <p><strong>Verificato:</strong> {selected.verificato ? 'Sì' : 'No'}</p>
            <div className="flex justify-end gap-2">
              {!selected.verificato && (
                <button
                  onClick={() => handleApprove(selected)}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Approva
                </button>
              )}
              <button
                onClick={() => startEdit(selected)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Modifica
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Elimina
              </button>
              <button
                onClick={() => setSelected(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}