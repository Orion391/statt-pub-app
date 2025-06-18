// by Orion

import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Statt Pub',
  description: 'Gestionale per il pub',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans bg-white text-gray-800">{children}</body>
    </html>
  );
}