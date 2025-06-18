// by Orion

'use client'

import React from 'react'
import Link from 'next/link'

interface LayoutWrapperProps {
  ruolo: 'admin' | 'dipendente'
  children: React.ReactNode
}

export default function LayoutWrapper({ ruolo, children }: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* qui potresti mettere header comune */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {ruolo === 'admin' ? 'Pannello Admin' : 'Pannello Dipendente'}
          </h1>
          <Link href="/" className="text-orange-600 hover:underline">
            Logout
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  )
}