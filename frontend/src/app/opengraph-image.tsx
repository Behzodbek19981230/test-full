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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
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
            background: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(6,182,212,0.1) 0%, transparent 50%)',
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
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              color: 'white',
              fontWeight: 900,
            }}
          >
            TM
          </div>
          <span
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: 'white',
              letterSpacing: -1,
            }}
          >
            Test Market
          </span>
        </div>

        <div
          style={{
            fontSize: 28,
            color: 'rgba(148,163,184,0.9)',
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
              <span style={{ fontSize: 36, fontWeight: 800, color: '#818cf8' }}>
                {stat.num}
              </span>
              <span style={{ fontSize: 16, color: 'rgba(148,163,184,0.7)' }}>
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
            color: 'rgba(100,116,139,0.6)',
          }}
        >
          test-market.uz
        </div>
      </div>
    ),
    { ...size }
  )
}
