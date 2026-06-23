import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 64, fontWeight: 800, color: '#1e293b', margin: 0 }}>404</h1>
        <p style={{ fontSize: 18, color: '#64748b', margin: '12px 0 24px' }}>Sahifa topilmadi</p>
        <Link href="/" style={{ color: '#1a7f8a', fontWeight: 600, textDecoration: 'none' }}>
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  )
}
