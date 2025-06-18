// by Orion

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User as FBUser } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

export default function DisponibilitaPage() {
  const router = useRouter();
  const [userName, setUserName]         = useState<string>('');
  const [area, setArea]                 = useState<'Sala'|'Cucina'>('Sala');
  const [docsMap, setDocsMap]           = useState<Record<string,string>>({});
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [status, setStatus]             = useState<'idle'|'saving'|'success'|'error'>('idle');

  // settings: weekStart e weekCount
  const [weekStart, setWeekStart] = useState<Date|null>(null);
  const [weekCount, setWeekCount] = useState<number>(1);

  // 0) carico la configurazione
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'settings', 'disponibilita'));
      if (snap.exists()) {
        const { weekStart, weekCount } = snap.data() as any;
        setWeekStart(weekStart.toDate());
        setWeekCount(weekCount);
      }
    })();
  }, []);

  // 1) recupera utente
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), async (u: FBUser|null) => {
      if (!u) return router.replace('/');
      const ud = await getDoc(doc(db,'users',u.uid));
      if (ud.exists()) {
        const { nome, area } = ud.data() as any;
        setUserName(nome);
        setArea(area);
      }
    });
    return () => unsub();
  }, [router]);

  // 2) carico disponibilità
  useEffect(() => {
    if (!userName) return;
    const q = query(
      collection(db,'disponibilita'),
      where('personale','==',userName),
      where('area','==',area)
    );
    return onSnapshot(q, snap => {
      const m:Record<string,string> = {};
      const s = new Set<string>();
      snap.docs.forEach(d => {
        const dt = (d.data() as any).day.toDate();
        const ymd = dt.toISOString().slice(0,10);
        m[ymd] = d.id;
        s.add(ymd);
      });
      setDocsMap(m);
      setSelectedDays(s);
    });
  }, [userName,area]);

  // 3) costruisco le settimane
  const weeks = React.useMemo(() => {
    if (!weekStart) return [] as string[][];
    const all: string[] = [];
    for (let w=0; w<weekCount; w++) {
      for (let d=0; d<7; d++) {
        const dt = new Date(weekStart);
        dt.setDate(weekStart.getDate() + w*7 + d);
        all.push(dt.toISOString().slice(0,10));
      }
    }
    const chunks: string[][] = [];
    for (let i=0; i<all.length; i+=7) {
      chunks.push(all.slice(i,i+7));
    }
    return chunks;
  }, [weekStart, weekCount]);

  const toggleDay = (d:string) => {
    const s = new Set(selectedDays);
    s.has(d) ? s.delete(d) : s.add(d);
    setSelectedDays(s);
  };

  const handleSubmit = async () => {
    setStatus('saving');
    try {
      const toAdd = Array.from(selectedDays).filter(d=>!docsMap[d]);
      const toRm  = Object.entries(docsMap)
        .filter(([d])=>!selectedDays.has(d))
        .map(([,id])=>id);

      await Promise.all([
        ...toAdd.map(ymd=>{
          const [Y,M,D] = ymd.split('-').map(x=>+x);
          const dt = new Date(Date.UTC(Y,M-1,D));
          return addDoc(collection(db,'disponibilita'),{personale:userName,area,day:Timestamp.fromDate(dt)});
        }),
        ...toRm.map(id=>deleteDoc(doc(db,'disponibilita',id)))
      ]);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (!weekStart) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento…</div>;
  }

  return (
    <main className="p-6 space-y-6">
      <Link href="/dashboard/dipendente" className="text-orange-600 hover:underline">
        ← Torna alla Dashboard
      </Link>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invia disponibilità</h1>
        <p>Utente: <strong>{userName}</strong> — Area: <strong>{area}</strong></p>
      </div>

      {/* un table per ciascuna settimana */}
      <div className="space-y-4">
        {weeks.map((week,i)=>(
          <table key={i} className="w-full table-fixed border">
            <thead>
              <tr>
                {week.map(day=>(
                  <th key={day} className="py-2 border">
                    {new Date(`${day}T00:00:00Z`)
                      .toLocaleDateString('it-IT',{weekday:'short',day:'numeric'})}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {week.map(day=>(
                  <td key={day} className="p-2 border text-center">
                    <input
                      type="checkbox"
                      checked={selectedDays.has(day)}
                      onChange={()=>toggleDay(day)}
                      disabled={status==='saving'}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={handleSubmit}
          disabled={!userName || status==='saving'}
          className={`px-4 py-2 rounded text-white ${
            userName && status!=='saving'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {status==='saving' ? 'Salvataggio…' : 'Salva'}
        </button>
        {status==='success' && <span className="text-green-700">✅ Salvato!</span>}
        {status==='error'   && <span className="text-red-600">❌ Errore</span>}
      </div>
    </main>
  );
}