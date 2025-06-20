'use client';
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface Articolo {
  id: string;
  nome: string;
  area: 'Sala' | 'Cucina';
  fornitorePref: string;
  unita: string;
}

interface Requisizione {
  id: string;
  articolo: string;
  quantita: number;
  area: 'Sala' | 'Cucina';
  richiedente: string;
  data: Timestamp;
  stato: 'pending' | 'approved' | 'rejected';
}

export default function RichiestePage() {
  const router = useRouter();
  const auth = getAuth();

  // stati utente
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin]   = useState(false);

  // dati
  const [articoli, setArticoli]   = useState<Articolo[]>([]);
  const [richieste, setRichieste] = useState<Requisizione[]>([]);

  // filtri area (multi-select)
  const [selectedAreas, setSelectedAreas] = useState({ Sala: true, Cucina: true });
  const [fornitoreFiltro, setFornitoreFiltro] = useState('');

  // checkbox di selezione
  const [selezionate, setSelezionate] = useState<Record<string,boolean>>({});

  // nuova richiesta
  const [newArea, setNewArea]         = useState<'Sala'|'Cucina'>('Sala');
  const [newArticolo, setNewArticolo] = useState('');
  const [newQuantita, setNewQuantita] = useState(1);

  // modal WhatsApp
  const [showModal, setShowModal]     = useState(false);
  const [waMessage, setWaMessage]     = useState('');

  // 1) utente
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (!u) return router.replace('/');
      const snap = await getDocs(
        query(collection(db,'users'), where('email','==',u.email))
      );
      const prof = snap.docs[0]?.data() as any;
      setUserName(prof?.nome || u.email || '');
      setIsAdmin(prof?.ruolo === 'admin');
    });
    return () => unsub();
  }, [auth, router]);

  // 2) articoli
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db,'inventory'));
      setArticoli(snap.docs.map(d => ({ id:d.id, ...(d.data() as any) })));
    })();
  }, []);

  // 3) richieste
  useEffect(() => {
    const base = collection(db,'requisitions');
    const q = isAdmin
      ? query(base)
      : query(base, where('richiedente','==',userName));
    const unsub = onSnapshot(q, s => {
      setRichieste(s.docs.map(d => ({ id:d.id, ...(d.data() as any) })));
      setSelezionate({});
    });
    return () => unsub();
  }, [isAdmin, userName]);

  // 4) invio nuova
  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticolo || newQuantita < 1)
      return alert('Seleziona articolo e quantità valida');
    await addDoc(collection(db,'requisitions'), {
      articolo: newArticolo,
      quantita: newQuantita,
      area: newArea,
      richiedente: userName,
      data: Timestamp.now(),
      stato: 'pending'
    });
    setNewArticolo('');
    setNewQuantita(1);
  };

  // toggle checkbox
  const toggle = (id:string) => {
    setSelezionate(s => ({ ...s, [id]: !s[id] }));
  };

  // open modal
  const openApproveModal = () => {
    const sel = richieste.filter(r => selezionate[r.id] && r.stato==='pending');
    if (sel.length === 0) return alert('Nessuna richiesta selezionata');
    let msg = 'Ciao, dovrei ordinare:\n';
    sel.forEach(r => {
      const art = articoli.find(a => a.nome === r.articolo);
      const unit = art?.unita || '';
      msg += `• ${r.quantita} ${unit} × ${r.articolo}\n`;
    });
    setWaMessage(encodeURIComponent(msg));
    setShowModal(true);
  };

  // conferma approvazione
  const confirmApprove = async () => {
    setShowModal(false);
    for (const id of Object.keys(selezionate).filter(id => selezionate[id])) {
      const reqRef = doc(db,'requisitions', id);
      await updateDoc(reqRef, { stato:'approved' });
      const snap = await getDoc(reqRef);
      const r = snap.data() as Requisizione;
      await addDoc(collection(db,'stockMovements'), {
        articolo:        r.articolo,
        quantita:        r.quantita,
        tipo:            'In transito',
        data:            Timestamp.now(),
        area:            r.area,
        arrivalStatus:   'pending',
        sourceRequest:   id,
        createdAt:       Timestamp.now()
      });
    }
    window.open(`https://wa.me/?text=${waMessage}`, '_blank');
  };

  // elimina singola richiesta (solo pending e se mio / admin)
  const handleDeleteReq = async (r: Requisizione) => {
    if (r.stato !== 'pending') return;
    if (!isAdmin && r.richiedente !== userName) return;
    if (!confirm('Eliminare questa richiesta?')) return;
    await deleteDoc(doc(db,'requisitions', r.id));
  };

  // 5) filtro pending + area/fornitore
  const displayed = richieste.filter(r => {
    if (r.stato !== 'pending') return false;
    if (!selectedAreas[r.area]) return false;
    if (fornitoreFiltro) {
      const art = articoli.find(a => a.nome === r.articolo);
      if (art?.fornitorePref !== fornitoreFiltro) return false;
    }
    return true;
  });

  return (
    <main className="p-6 space-y-6">
      <button
        onClick={() => router.push('/dashboard/admin/magazzino')}
        className="text-orange-600 hover:underline"
      >
        ← Torna al magazzino
      </button>

      {/* --- NUOVA RICHIESTA --- */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Nuova Richiesta</h2>
        <form onSubmit={handleNewSubmit} className="flex flex-wrap gap-3">
          <select
            value={newArea}
            onChange={e => setNewArea(e.target.value as any)}
            className="border p-2 rounded"
          >
            <option value="Sala">Sala</option>
            <option value="Cucina">Cucina</option>
          </select>
          <select
            value={newArticolo}
            onChange={e => setNewArticolo(e.target.value)}
            className="border p-2 rounded flex-1"
          >
            <option value="">Seleziona Articolo</option>
            {articoli.filter(a=>a.area===newArea).map(a=>(
              <option key={a.id} value={a.nome}>{a.nome}</option>
            ))}
          </select>
          <input
            type="number" min="1"
            value={newQuantita}
            onChange={e => setNewQuantita(+e.target.value)}
            className="border p-2 rounded w-24"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Richiedi
          </button>
        </form>
      </section>

      {/* --- FILTRI E TABELLA --- */}
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          {(['Sala','Cucina'] as const).map(a => (
            <label key={a} className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={selectedAreas[a]}
                onChange={() =>
                  setSelectedAreas(s => ({ ...s, [a]: !s[a] }))
                }
              />
              <span>{a}</span>
            </label>
          ))}
          <select
            value={fornitoreFiltro}
            onChange={e => setFornitoreFiltro(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">Tutti i fornitori</option>
            {[...new Set(articoli.map(a => a.fornitorePref))].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <h2 className="font-semibold mb-2">Richieste Pending</h2>
          <table className="w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th></th>
                <th>Data</th><th>Articolo</th><th>Unità</th><th>Q.tà</th><th>Richiedente</th><th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length > 0 ? displayed.map(r => {
                const d = r.data.toDate().toLocaleDateString('it-IT');
                const art = articoli.find(a => a.nome === r.articolo);
                return (
                  <tr key={r.id} className="border-b">
                    <td className="px-2">
                      <input
                        type="checkbox"
                        checked={!!selezionate[r.id]}
                        onChange={() => toggle(r.id)}
                      />
                    </td>
                    <td className="px-3 py-1">{d}</td>
                    <td className="px-3 py-1">{r.articolo}</td>
                    <td className="px-3 py-1">{art?.unita}</td>
                    <td className="px-3 py-1">{r.quantita}</td>
                    <td className="px-3 py-1">{r.richiedente}</td>
                    <td className="px-3 py-1 space-x-2">
                      <button
                        onClick={() => updateDoc(doc(db,'requisitions',r.id),{stato:'rejected'})}
                        className="text-red-600 hover:underline text-sm"
                      >Rifiuta</button>
                      <button
                        onClick={() => handleDeleteReq(r)}
                        className="text-gray-600 hover:underline text-sm"
                      >Elimina</button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="text-center py-2 text-gray-500">
                    Nessuna richiesta
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-3 text-right">
            <button
              onClick={openApproveModal}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Approva selezionate
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL WHATSAPP --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Conferma approvazione</h3>
            <p>Verrà aperto WhatsApp con questo messaggio:</p>
            <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">
              {decodeURIComponent(waMessage)}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Annulla
              </button>
              <button
                onClick={confirmApprove}
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