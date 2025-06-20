'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [nome, setNome] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    document.title = 'Dashboard Admin - Statt Pub';

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        const nomeUtente = docSnap.data()?.nome;
        setNome(nomeUtente || 'Utente');
      }
    });

    return () => unsubscribe();
  }, []);

  const sezioni = [
    {
      title: '🍽️ Gestione Movimenti',
      description: 'Aggiungi spese e incassi giornalieri',
      href: '/dashboard/admin/movimenti',
    },
    {
      title: '📊 Statistiche',
      description: 'Visualizza andamento incassi e spese',
      href: '/dashboard/admin/statistiche',
    },
    {
      title: '🧑‍🍳 Gestione Turni',
      description: 'Crea e modifica i turni settimanali',
      href: '/dashboard/admin/turni',
    },
    {
      title: '📦 Magazzino',
      description: 'Gestisci i tuoi fornitori',
      href: '/dashboard/admin/magazzino',
    },
    {
      title: '🚛 Fornitori',
      description: 'Gestisci i tuoi fornitori',
      href: '/dashboard/admin/fornitori',
    },
    {
      title: '👥 Utenti',
      description: 'Aggiungi o modifica utenti',
      href: '/dashboard/admin/utenti',
    },
    {
      title: '⚙️ Configura Disponibilità',
      description: 'Imposta settimana di invio e numero di settimane',
      href: '/dashboard/admin/disponibilita-config', 
    },

    
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-800">
            👋 Ciao {nome || '...'}, benvenuto nella dashboard
          </h1>
          <p className="text-gray-600 mt-1">Seleziona una sezione per iniziare:</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sezioni.map(({ title, description, href }) => (
            <div
              key={href}
              onClick={() => router.push(href)}
              className="cursor-pointer bg-white p-5 rounded-xl shadow hover:shadow-md border hover:border-orange-400 transition"
            >
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}