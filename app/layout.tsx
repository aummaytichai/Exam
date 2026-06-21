import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Food Delivery Platform',
  description: 'Fullstack Developer Exam Demo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
