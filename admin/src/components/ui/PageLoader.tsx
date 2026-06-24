import { IconLoader2 } from '@tabler/icons-react'

interface PageLoaderProps {
  rows?: number
  withStats?: boolean
  withChart?: boolean
  variant?: 'table' | 'question'
}

export default function PageLoader({ rows = 5, withStats = false, withChart = false, variant = 'table' }: PageLoaderProps) {
  return (
    <div className="page-loader">
      <div className="page-loader__header">
        <div className="skeleton skeleton--circle" style={{ width: 40, height: 40 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton--text" style={{ width: 180, height: 20 }} />
          <div className="skeleton skeleton--text" style={{ width: 100, height: 14, marginTop: 6 }} />
        </div>
      </div>

      {withStats && (
        <div className="page-loader__stats">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="page-loader__stat-card">
              <div className="skeleton skeleton--circle" style={{ width: 36, height: 36 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton--text" style={{ width: '60%', height: 12 }} />
                <div className="skeleton skeleton--text" style={{ width: '40%', height: 22, marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {withChart && (
        <div className="page-loader__charts">
          {[1, 2].map(i => (
            <div key={i} className="page-loader__chart-card">
              <div className="skeleton skeleton--text" style={{ width: 140, height: 16, marginBottom: 16 }} />
              <div className="page-loader__chart-bars">
                {[65, 40, 80, 55, 70, 45, 60].map((h, j) => (
                  <div key={j} className="skeleton" style={{ width: '100%', height: `${h}%`, borderRadius: 6 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'question' ? (
        <>
          {/* AI tools skeleton */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[110, 120, 100, 130, 140].map((w, i) => (
              <div key={i} className="skeleton" style={{ width: w, height: 32, borderRadius: 8 }} />
            ))}
          </div>

          {/* Question text card */}
          <div className="page-loader__card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="skeleton skeleton--circle" style={{ width: 36, height: 36 }} />
              <div>
                <div className="skeleton skeleton--text" style={{ width: 120, height: 16 }} />
                <div className="skeleton skeleton--text" style={{ width: 220, height: 12, marginTop: 4 }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: '100%', height: 36, borderRadius: 8, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '100%', height: 120, borderRadius: 8 }} />
          </div>

          {/* Options card */}
          <div className="page-loader__card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="skeleton skeleton--circle" style={{ width: 36, height: 36 }} />
              <div>
                <div className="skeleton skeleton--text" style={{ width: 140, height: 16 }} />
                <div className="skeleton skeleton--text" style={{ width: 200, height: 12, marginTop: 4 }} />
              </div>
            </div>
            {['A', 'B', 'C', 'D'].map((_, i) => (
              <div key={i} className="page-loader__option-row" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="skeleton skeleton--circle" style={{ width: 40, height: 40, borderRadius: 12 }} />
                <div className="skeleton" style={{ flex: 1, height: 60, borderRadius: 8 }} />
              </div>
            ))}
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <div className="skeleton" style={{ width: 100, height: 38, borderRadius: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skeleton" style={{ width: 170, height: 38, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: 100, height: 38, borderRadius: 8 }} />
            </div>
          </div>
        </>
      ) : (
        <div className="page-loader__table">
          <div className="page-loader__table-header">
            {[120, 160, 100, 80, 90].map((w, i) => (
              <div key={i} className="skeleton skeleton--text" style={{ width: w, height: 12 }} />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="page-loader__table-row" style={{ animationDelay: `${i * 0.05}s` }}>
              {[140, 180, 110, 70, 80].map((w, j) => (
                <div key={j} className="skeleton skeleton--text" style={{ width: w, height: 14 }} />
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="page-loader__spinner">
        <IconLoader2 size={20} className="page-loader__spin-icon" />
        <span>Yuklanmoqda...</span>
      </div>
    </div>
  )
}
