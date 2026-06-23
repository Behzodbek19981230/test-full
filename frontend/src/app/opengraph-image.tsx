import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Test Market — DTM va Attestatsiyaga Tayyorlanish Platformasi'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2f1 50%, #f8fafc 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(26,127,138,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(212,132,42,0.08) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 32,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={new URL('/icon.png', 'https://test-market.uz').toString()}
            alt=""
            width={80}
            height={80}
            style={{ borderRadius: 18, objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#1e293b',
              letterSpacing: -1,
            }}
          >
            Test Market
          </span>
        </div>

        <div
          style={{
            fontSize: 28,
            color: '#475569',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
            display: 'flex',
          }}
        >
          DTM va Attestatsiyaga Mukammal Tayyorlanish Platformasi
        </div>

        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 48,
          }}
        >
          {[
            { num: '500+', label: 'Foydalanuvchi' },
            { num: '10+', label: 'Fanlar' },
            { num: '1000+', label: 'Savollar' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 36, fontWeight: 800, color: '#1a7f8a' }}>
                {stat.num}
              </span>
              <span style={{ fontSize: 16, color: '#64748b' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 24,
            display: 'flex',
            fontSize: 16,
            color: '#94a3b8',
          }}
        >
          test-market.uz
        </div>
      </div>
    ),
    { ...size }
  )
}
