'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import Link from 'next/link';

export default function FornitoriPage() {
  // date di filtro
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);

  // tutti i fornitori
  const [allFornitori, setAllFornitori] = useState<string[]>([]);
  const [selFornitori, setSelFornitori] = useState<Set<string>>(new Set());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // dati aggregati per lista/table
  const [totals, setTotals] = useState<Record<string, number>>({});

  // ----------------------------------------------------------------------
  // fetch fornitori unici
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fornitori'), snap => {
      const names = snap.docs.map(d => d.data().nome as string);
      setAllFornitori(names);
      setSelFornitori(new Set(names)); // di default tutti
    });
    return () => unsub();
  }, []);

  // chiusura dropdown al click fuori
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ricalcolo totali + dati chart
  useEffect(() => {
    const from = Timestamp.fromDate(new Date(`${startDate}T00:00:00`));
    const to   = Timestamp.fromDate(new Date(`${endDate}T23:59:59`));
    const q = query(
      collection(db, 'movimenti'),
      where('tipo', '==', 'Spesa'),
      where('data', '>=', from),
      where('data', '<=', to),
    );
    const unsub = onSnapshot(q, snap => {
      const agg: Record<string, number> = {};
      snap.docs.forEach(d => {
        const m = d.data() as any;
        const key = m.categoria || 'Altro';
        if (selFornitori.has(key)) {
          agg[key] = (agg[key]||0) + m.importo;
        }
      });
      setTotals(agg);
    });
    return () => unsub();
  }, [startDate, endDate, selFornitori]);

  const toggleFornitore = (f: string) => {
    setSelFornitori(prev => {
      const copy = new Set(prev);
      if (copy.has(f)) copy.delete(f);
      else copy.add(f);
      return copy;
    });
  };

  // prepara dati per Recharts
  const chartData = Object.entries(totals).map(([name, val]) => ({
    fornitore: name,
    importo: val,
  }));

  return (
    <div className="space-y-6 p-6">
      
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin"
          className="text-orange-600 hover:underline flex items-center gap-1"
        >
          ← Torna alla Dashboard
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📊 Fornitori
        </h1>
      </div>

      {/* --- Filtri date + dropdown multi-select --- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <label className="block text-sm mb-1">Da</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">A</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm mb-1">Fornitori</label>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="w-64 border rounded p-2 text-left flex justify-between items-center"
          >
            {selFornitori.size === allFornitori.length
              ? 'Tutti'
              : Array.from(selFornitori).join(', ')}
            {dropdownOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/> }
          </button>
          {dropdownOpen && (
            <ul className="absolute z-10 mt-1 w-64 max-h-48 overflow-auto bg-white border rounded shadow">
              {allFornitori.map(f => (
                <li key={f}
                    className="px-3 py-2 hover:bg-gray-100 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selFornitori.has(f)}
                    onChange={() => toggleFornitore(f)}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* --- Grafico a barre --- */}
      <div className="w-full h-64 bg-white rounded shadow p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <XAxis dataKey="fornitore" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `€${v.toFixed(0)}`} />
            <Tooltip formatter={(value: number) => `€ ${value.toFixed(2)}`} />
            <Bar dataKey="importo" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- Lista riepilogativa --- */}
      <ul className="space-y-2 mt-4">
        {Object.entries(totals).map(([fornitore, imp]) => (
          <li key={fornitore}
              className="flex justify-between bg-white p-3 rounded shadow">
            <span>{fornitore}</span>
            <span>€ {imp.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}