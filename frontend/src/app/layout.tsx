import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TestFull — DTM va Attestatsiyaga Tayyorlanish Platformasi',
  description: 'Abituriyent, o\'qituvchi va o\'quvchilar uchun DTM va attestatsiyaga tayyorlanish uchun sinov va blok testlar platformasi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  )
}
