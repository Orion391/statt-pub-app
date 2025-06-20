// by Orion

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, app } from '@/lib/firebase/config';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const router                  = useRouter();

  // debug: verifica che l'app Firebase sia inizializzata
  console.log('[LoginPage] Imported Firebase app name:', app.name);

  const login = async () => {
    setLoading(true);
    try {
      // 1) fai il login client-side per ottenere l’ID token
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const idToken   = await user.getIdToken();

      // 2) invia l’ID token al tuo endpoint che crea il session cookie
      const res = await fetch('/api/session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error('Login server failed');

      // ⚠ qui leggiamo “ruolo” anziché “role”
      const { ruolo } = await res.json();
      console.log('✅ Session created – ruolo:', ruolo);

      // 3) reindirizza in base al ruolo
      if (ruolo === 'admin')             router.push('/dashboard/admin');
      else if (ruolo === 'responsabile') router.push('/dashboard/responsabile');
      else if (ruolo === 'dipendente')   router.push('/dashboard/dipendente');
      else alert(`Ruolo "${ruolo}" non riconosciuto`);
    } catch (e: any) {
      console.error('[LoginPage]', e);
      alert(e.message || 'Errore nel login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/logo-statt.png"
            alt="Logo Statt"
            width={72}
            height={72}
            className="rounded-md"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            Benvenuto nel Gestionale
          </h1>
          <p className="text-sm text-gray-500">
            Accedi con il tuo account aziendale
          </p>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            login();
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="tuo@email.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          © {new Date().getFullYear()} Statt Pub
        </p>
      </div>
    </main>
  );
}