// by Orion

'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <main className="bg-gray-50 min-h-screen p-6 relative">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>

      {/* Logout fisso in basso a destra */}
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full shadow hover:bg-red-200 transition"
      >
        <LogOut size={16} />
        Logout
      </button>
    </main>
  );
}