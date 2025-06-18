// by Orion

// app/dashboard/admin/statistiche/layout.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StatisticheLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/dashboard/admin/statistiche/totale', label: '📈 Totale' },
    { href: '/dashboard/admin/statistiche/fornitori', label: '🛒 Fornitori' },
    { href: '/dashboard/admin/statistiche/dipendenti', label: '👥 Dipendenti' },
  ];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Statistiche</h1>
      <nav className="mb-6 flex gap-4">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              pathname === tab.href
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}