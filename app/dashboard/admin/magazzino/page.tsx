// app/dashboard/admin/magazzino/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export default function MagazzinoDashboard() {
  const router = useRouter();

  const sections = [
    {
      title: '📥 Movimenti Magazzino',
      description: 'Registra entrate e uscite di merce',
      href: '/dashboard/admin/magazzino/movimenti',
    },
    {
      title: '📝 Richieste di Approvvigionamento',
      description: 'Gestisci richieste e approvazioni',
      href: '/dashboard/admin/magazzino/richieste',
    },
    {
      title: '📊 Report Livelli',
      description: 'Visualizza livelli critici e storico',
      href: '/dashboard/admin/magazzino/report',
    },
    {
      title: '📦 Anagrafica Articoli',
      description: 'Gestisci articoli e fornitori',
      href: '/dashboard/admin/magazzino/inventory',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Back to Admin Dashboard */}
      <button
        onClick={() => router.push('/dashboard/admin')}
        className="text-orange-600 hover:underline mb-6"
      >
        ← Torna alla Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Magazzino</h1>
      <p className="text-gray-600 mb-8">
        Seleziona una sezione per gestire il magazzino:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map(sec => (
          <Link
            key={sec.href}
            href={sec.href}
            className="flex items-start justify-between p-6 bg-white rounded-xl shadow hover:shadow-md transition border hover:border-orange-400"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{sec.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{sec.description}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
        ))}
      </div>
    </main>
  );
}