'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DipendenteDashboard() {
  const router = useRouter();

  const cards = [
    {
      title: '📅 Invia disponibilità',
      desc: 'Segnala i giorni in cui puoi lavorare',
      href: '/dashboard/dipendente/disponibilita',
    },
    {
      title: '⏰ I tuoi turni',
      desc: 'Visualizza i turni assegnati',
      href: '/dashboard/dipendente/turni',
    },
    {
      title: '📦 Magazzino',
      desc: 'Invia richieste per magazzino',
      href: '/dashboard/dipendente/magazzino',
    },
  ];

  return (
    <>
      <header className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Benvenuto nel tuo pannello
        </h2>
        <p className="text-gray-600 mt-1">
          Seleziona ciò che vuoi fare:
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(({ title, desc, href }) => (
          <div
            key={href}
            onClick={() => router.push(href)}
            className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg border hover:border-orange-400 transition"
          >
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mt-2">{desc}</p>
          </div>
        ))}
      </section>
    </>
  );
}