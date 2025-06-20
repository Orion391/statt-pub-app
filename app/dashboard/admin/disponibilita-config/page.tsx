'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRouter } from 'next/navigation';

export default function DisponibilitaConfigPage() {
  const [start, setStart] = useState<Date | null>(null);
  const [weeks, setWeeks] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const router = useRouter();

  // 1) Carica la config da Firestore
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'settings', 'disponibilita'));
      if (snap.exists()) {
        const data = snap.data();
        setStart(data.weekStart.toDate());
        setWeeks(data.weekCount);
      }
    })();
  }, []);

  // Salva le impostazioni
  const handleSave = async () => {
    if (!start) return alert('Seleziona una data di inizio');
    setLoading(true);
    try {
      await setDoc(
        doc(db, 'settings', 'disponibilita'),
        { weekStart: start, weekCount: weeks },
        { merge: true }
      );
      alert('🚀 Impostazioni salvate!');
      router.push('/dashboard/admin');
    } catch (e) {
      console.error(e);
      alert('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  // Pulisce tutte le disponibilità
  const handleClear = async () => {
    if (!confirm('Sei sicuro di voler cancellare TUTTE le disponibilità?')) return;
    setClearing(true);
    try {
      const snap = await getDocs(collection(db, 'disponibilita'));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'disponibilita', d.id))));
      alert('✅ Tutte le disponibilità sono state rimosse.');
    } catch (e) {
      console.error(e);
      alert('❌ Errore durante la pulizia');
    } finally {
      setClearing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
                <button
            onClick={() => router.push('/dashboard/admin')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex-1"
          >
            ← Torna alla Dashboard
          </button>
          
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4">
        
        <h1 className="text-xl font-bold">Configura disponibilità</h1>

        <div>
          <label className="block mb-1 font-medium">Data di inizio settimana</label>
          <ReactDatePicker
            selected={start}
            onChange={date => setStart(date)}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Numero di settimane</label>
          <input
            type="number"
            min={1}
            value={weeks}
            onChange={e => setWeeks(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div className="flex justify-between space-x-2">

          <button
            onClick={handleClear}
            disabled={clearing}
            className={`px-4 py-2 text-white rounded ${
              clearing ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'
            } flex-1`}
          >
            {clearing ? 'Pulizia…' : 'Pulisci disponibilità'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-4 py-2 text-white rounded ${
              loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
            } flex-1`}
          >
            {loading ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </main>
  );
}