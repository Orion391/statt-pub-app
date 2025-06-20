'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  CartesianGrid,
} from 'recharts';

type DataPoint = {
  date: string;
  Spesa: number;
  Incasso: number;
};

export default function TotalePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]   = useState(today);
  const [showSpesa, setShowSpesa]     = useState(true);
  const [showIncasso, setShowIncasso] = useState(true);
  const [chartData, setChartData]     = useState<DataPoint[]>([]);

  useEffect(() => {
    // costruiamo i timestamp per l'inizio e la fine del giorno
    const from = Timestamp.fromDate(new Date(`${startDate}T00:00:00`));
    const to   = Timestamp.fromDate(new Date(`${endDate}T23:59:59`));

    const q = query(
      collection(db, 'movimenti'),
      where('data', '>=', from),
      where('data', '<=', to),
      orderBy('data', 'asc')
    );

    const unsub = onSnapshot(q, snap => {
      // raggruppa per data
      const map: Record<string, { Spesa: number; Incasso: number }> = {};
      snap.docs.forEach(doc => {
        const m = doc.data() as any;
        const day = m.data.toDate().toLocaleDateString('it-IT');
        if (!map[day]) map[day] = { Spesa: 0, Incasso: 0 };
        if (m.tipo === 'Spesa') {
          map[day].Spesa += m.importo;
        } else {
          map[day].Incasso += m.importo;
        }
      });
      // trasforma in array ordinato
      const dataArray = Object.entries(map).map(([date, vals]) => ({
        date,
        Spesa: vals.Spesa,
        Incasso: vals.Incasso,
      }));
      setChartData(dataArray);
    });

    return () => unsub();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6 p-6">
      {/* back button + title */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin"
          className="text-orange-600 hover:underline flex items-center gap-1"
        >
          ← Torna alla Dashboard
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📊 Totale
        </h1>
      </div>

      {/* filtri */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 bg-white p-4 rounded-lg shadow">
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showSpesa}
            onChange={e => setShowSpesa(e.target.checked)}
          />
          Spese
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showIncasso}
            onChange={e => setShowIncasso(e.target.checked)}
          />
          Incassi
        </label>
      </div>

      {/* grafico */}
      <div className="bg-white p-4 rounded-lg shadow">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(val: number) => `€ ${val.toFixed(2)}`} />
            <Legend />
            {showSpesa && (
              <Line
                type="monotone"
                dataKey="Spesa"
                stroke="#ef4444"
                dot={false}
              />
            )}
            {showIncasso && (
              <Line
                type="monotone"
                dataKey="Incasso"
                stroke="#10b981"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}