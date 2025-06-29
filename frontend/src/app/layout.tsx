import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'COAS TEAM - OSINT Platform',
  description: 'Plataforma profesional de OSINT con 18 herramientas de reconocimiento e inteligencia',
  keywords: ['OSINT', 'reconnaissance', 'intelligence', 'security', 'information gathering'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <div className="min-h-full">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
