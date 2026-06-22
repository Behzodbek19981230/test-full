import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tizimga kirish',
  description: "Test Market platformasiga Google yoki Telegram orqali kiring. DTM va attestatsiya testlarini ishlash uchun ro'yxatdan o'ting.",
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
