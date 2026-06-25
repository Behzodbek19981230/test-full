import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tizimga kirish',
  description: "Test Market platformasiga kiring yoki ro'yxatdan o'ting. Telefon raqam, Google yoki Telegram orqali kirish mumkin.",
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
