// by Orion

'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import Image from 'next/image';

export default function ResponsabileDashboard() {
  const router = useRouter();

  // qui aggiungi tutte le sezioni di cui il responsabile ha bisogno
  const cards = [
    {
      title: '📦 Magazzino',
      desc: 'Gestisci articoli e fornitori',
      href: '/dashboard/responsabile/magazzino',

    },
    {
      title: '🔄 Movimenti',
      desc: 'Registra ingressi, uscite e arrivi',
      href: '/dashboard/responsabile/movimenti',

    },
    {
        title: '📅 Invia disponibilità',
        desc: 'Segnala i giorni in cui puoi lavorare',
        href: '/dashboard/responsabile/disponibilita',
      },
      {
        title: '⏰ I tuoi turni',
        desc: 'Visualizza i turni assegnati',
        href: '/dashboard/responsabile/turni',
      },

  ];

  return (
    <>
      <header className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Pannello Responsabile
        </h2>
        <p className="text-gray-600 mt-1">Scegli una sezione:</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(({ title, desc, href, }) => (
          <div
            key={href}
            onClick={() => router.push(href)}
            className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg border hover:border-orange-400 transition flex items-start gap-4"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}