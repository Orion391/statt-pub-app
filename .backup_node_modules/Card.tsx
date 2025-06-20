// by Orion

'use client'

import Link from 'next/link'

interface CardProps {
  title: string
  description: string
  href: string
}

export default function Card({ title, description, href }: CardProps) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition"
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  )
}