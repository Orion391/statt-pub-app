// app/dashboard/dipendente/turni/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

export default function TurniPage() {
  const router = useRouter();

  // settings
  const [weekStart, setWeekStart] = useState<Date|null>(null);
  const [weekCount, setWeekCount] = useState<number>(1);

  // utente
  const [userName, setUserName] = useState<string>('');
  const [area, setArea]         = useState<string>('');

  // mappe
  const [myTurns, setMyTurns]         = useState<Record<string,string>>({});
  const [genericMap, setGenericMap]   = useState<Record<string,Array<{nome:string;orario:string}>>>({});

  // 1) carico settings
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db,'settings','disponibilita'));
      if (snap.exists()) {
        const d = snap.data() as any;
        setWeekStart(d.weekStart.toDate());
        setWeekCount(d.weekCount);
      }
    })();
  }, []);

  // 2) carico utente
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), async u => {
      if (!u) return router.replace('/');
      const ud = await getDoc(doc(db,'users',u.uid));
      if (ud.exists()) {
        setUserName(ud.data()!.nome);
        setArea(ud.data()!.area);
      }
    });
    return () => unsub();
  }, [router]);

  // 3) i tuoi turni
  useEffect(() => {
    if (!userName) return;
    const q = query(collection(db,'turni'), where('personale','==',userName));
    return onSnapshot(q, snap => {
      const m: Record<string,string> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        const dt = data.start.toDate();
        const key = dt.toISOString().slice(0,10);
        m[key] = dt.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
      });
      setMyTurns(m);
    });
  }, [userName]);

  // 4) calendario generico
  useEffect(() => {
    if (!area) return;
    const q = query(collection(db,'turni'), where('area','==',area));
    return onSnapshot(q, snap => {
      const m: Record<string,Array<{nome:string;orario:string}>> = {};
      snap.docs.forEach(d => {
        const data = d.data() as any;
        const dt = data.start.toDate();
        const key = dt.toISOString().slice(0,10);
        m[key] = m[key]||[];
        m[key].push({
          nome: data.personale,
          orario: dt.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}),
        });
      });
      setGenericMap(m);
    });
  }, [area]);

  // 5) suddivido in settimane da 7 giorni
  const weeks = React.useMemo(() => {
    if (!weekStart) return [];
    const all: string[] = [];
    for (let w=0; w<weekCount; w++) {
      for (let d=0; d<7; d++) {
        const dt = new Date(weekStart);
        dt.setDate(weekStart.getDate() + w*7 + d);
        all.push(dt.toISOString().slice(0,10));
      }
    }
    const out: string[][] = [];
    for (let i=0; i<all.length; i+=7) out.push(all.slice(i,i+7));
    return out;
  }, [weekStart, weekCount]);

  if (!weekStart || !userName) {
    return <div className="min-h-screen flex items-center justify-center">Caricamento…</div>;
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/responsabile" className="text-orange-600 hover:underline">
        ← Torna alla Dashboard
      </Link>

      {/* I TUOI TURNI */}
      <section>
        <h1 className="text-2xl font-bold mb-2">I tuoi turni</h1>
        {weeks.map((days, wi) => (
          <table key={wi} className="w-full table-fixed border mb-4">
            <thead className="bg-gray-100">
              <tr>
                {days.map(d => {
                  const dt = new Date(`${d}T00:00:00Z`);
                  return (
                    <th key={d} className="px-2 py-1 border text-center text-xs text-gray-500">
                      {dt.toLocaleDateString('it-IT',{weekday:'short'})}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {days.map(d => (
                  <th key={d} className="px-2 py-1 border text-center font-medium">
                    {new Date(`${d}T00:00:00Z`).getUTCDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {days.map(d => (
                  <td key={d} className="px-2 py-4 border text-center">
                    {myTurns[d]
                      ? <div className="text-green-600 font-semibold">
                          ✔ {myTurns[d]}
                        </div>
                      : <span className="text-gray-300">–</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        ))}
      </section>

      {/* CALENDARIO GENERICO */}
      <section>
        <h2 className="text-2xl font-bold mb-2">Calendario Generico</h2>
        {weeks.map((days, wi) => (
          <table key={wi} className="w-full table-fixed border mb-4">
            <thead className="bg-gray-100">
              <tr>
                {days.map(d => {
                  const dt = new Date(`${d}T00:00:00Z`);
                  return (
                    <th key={d} className="px-2 py-1 border text-center text-xs text-gray-500">
                      {dt.toLocaleDateString('it-IT',{weekday:'short'})}
                    </th>
                  );
                })}
              </tr>
              <tr>
                {days.map(d => (
                  <th key={d} className="px-2 py-1 border text-center font-medium">
                    {new Date(`${d}T00:00:00Z`).getUTCDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {days.map(d => (
                  <td key={d} className="px-2 py-4 border text-sm align-top">
                    {genericMap[d]?.map((u,i) => (
                      <div key={i} className="mb-1">
                        {u.nome} <span className="text-xs text-gray-500">({u.orario})</span>
                      </div>
                    )) || <span className="text-gray-300">–</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        ))}
      </section>
    </main>
  );
}