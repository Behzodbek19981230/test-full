'use client'

import { useEffect, useState } from 'react'
import {
  IconBrandTelegram, IconSchool, IconClipboardCheck, IconUsers,
  IconClock, IconCurrencyDollar, IconChevronRight, IconDeviceMobile,
  IconBolt, IconChartBar, IconTarget, IconCreditCard, IconBooks,
  IconMenu2, IconX, IconArrowRight, IconCheck, IconFileText
} from '@tabler/icons-react'

const BOT_URL = 'https://t.me/test_market_uzbot'

function SubjectIcon({ icon, size = 26 }: { icon: string; size?: number }) {
  if (!icon) return <span style={{ fontSize: size }}>📚</span>

  if (icon.startsWith('<svg') || icon.startsWith('<?xml')) {
    const cleaned = icon.replace(/<\?xml[^?]*\?>\s*/g, '')
    const sized = cleaned
      .replace(/width="[^"]*"/g, `width="${size}"`)
      .replace(/height="[^"]*"/g, `height="${size}"`)
    const hasSize = /width=/.test(sized)
    const final = hasSize ? sized : sized.replace('<svg', `<svg width="${size}" height="${size}"`)
    return (
      <span
        style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: final }}
      />
    )
  }

  if (icon.startsWith('/api/') || icon.startsWith('http') || icon.startsWith('data:')) {
    return <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  }

  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>
}

interface Subject {
  id: number; name: string; icon: string; description: string; test_count: number
}

interface Test {
  id: number; title: string; price: number; question_count: number; duration_minutes: number
}

interface Stats {
  total_users: number; total_tests: number; total_attempts: number; total_subjects: number
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tests, setTests] = useState<Record<number, Test[]>>({})
  const [stats, setStats] = useState<Stats>({ total_users: 0, total_tests: 0, total_attempts: 0, total_subjects: 0 })
  const [expanded, setExpanded] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(setSubjects).catch(() => {})
    fetch('/api/stats/public').then(r => r.json()).then(setStats).catch(() => {})

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const loadTests = async (id: number) => {
    if (expanded === id) { setExpanded(null); return }
    if (!tests[id]) {
      const res = await fetch(`/api/tests?subject_id=${id}`)
      const data = await res.json()
      setTests(prev => ({ ...prev, [id]: data }))
    }
    setExpanded(id)
  }

  const fmt = (n: number) => n === 0 ? 'Bepul' : `${n.toLocaleString()} so'm`

  return (
    <>
      {/* Navbar */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <a href="/" className="logo">
            <div className="logo-icon"><IconSchool size={20} /></div>
            <span>TestFull</span>
          </a>

          <ul className="nav-links">
            <li><a href="#fanlar">Fanlar</a></li>
            <li><a href="#qanday">Qanday ishlaydi</a></li>
            <li><a href="#imkoniyatlar">Imkoniyatlar</a></li>
          </ul>

          <div className="nav-cta">
            <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <IconBrandTelegram size={18} /> Boshlash
            </a>
            <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid-pattern" />
        </div>
        <div className="container hero-content">
          <div className="hero-layout">
            <div>
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                DTM 2024-2025 yangi testlar
              </div>

              <h1 className="hero-title">
                DTM va Attestatsiyaga<br />
                <span className="gradient">Mukammal Tayyorlanish</span>
              </h1>

              <p className="hero-desc">
                Abituriyent, o&apos;qituvchi va o&apos;quvchilar uchun maxsus platforma.
                Sinov testlarini ishlang, natijangizni real vaqtda tekshiring.
              </p>

              <div className="hero-actions">
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                  <IconBrandTelegram size={20} /> Telegram orqali boshlash
                </a>
                <a href="#fanlar" className="btn btn-secondary btn-lg">
                  Testlarni ko&apos;rish <IconArrowRight size={18} />
                </a>
              </div>

              <div className="hero-trust">
                <div className="hero-avatars">
                  {['A', 'B', 'S', 'N'].map((l, i) => (
                    <div key={i} className="hero-avatar" style={{
                      background: ['linear-gradient(135deg,#6366f1,#7c3aed)', 'linear-gradient(135deg,#06b6d4,#3b82f6)',
                        'linear-gradient(135deg,#10b981,#06b6d4)', 'linear-gradient(135deg,#f59e0b,#ef4444)'][i]
                    }}>{l}</div>
                  ))}
                </div>
                <div className="hero-trust-text">
                  <strong>{stats.total_users > 0 ? `${stats.total_users.toLocaleString()}+` : '500+'}</strong> foydalanuvchi ishonch bildirgan
                </div>
              </div>
            </div>

            <div className="hero-card-wrapper">
              <div className="hero-card">
                <div className="hero-card-top">
                  <div className="hero-card-subject">
                    <div className="hero-card-icon"><IconFileText size={22} /></div>
                    <div className="hero-card-info">
                      <h4>Matematika</h4>
                      <span>Savol 3 / 30</span>
                    </div>
                  </div>
                  <div className="hero-card-timer">
                    <IconClock size={15} /> 42:15
                  </div>
                </div>
                <div className="hero-card-body">
                  <div className="hero-q-num">Savol 3</div>
                  <div className="hero-q-text">
                    Agar f(x) = 2x&sup2; + 3x - 5 bo&apos;lsa, f(2) ning qiymatini toping.
                  </div>
                  <div className="hero-options">
                    {[['A', '7', false], ['B', '9', true], ['C', '11', false], ['D', '13', false]].map(([l, v, c]) => (
                      <div key={l as string} className={`hero-option ${c ? 'correct' : ''}`}>
                        <div className="hero-option-letter">
                          {c ? <IconCheck size={16} /> : l as string}
                        </div>
                        <span className="hero-option-text">{v as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hero-card-footer">
                  <div className="hero-progress">
                    <div className="hero-progress-bar"><div className="hero-progress-fill" /></div>
                    <span className="hero-progress-text">3 / 30 savol</span>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>2 to&apos;g&apos;ri</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            {[
              { icon: <IconUsers size={24} />, cls: 'purple', val: stats.total_users || 500, label: 'Foydalanuvchilar' },
              { icon: <IconClipboardCheck size={24} />, cls: 'cyan', val: stats.total_tests || 50, label: 'Testlar' },
              { icon: <IconChartBar size={24} />, cls: 'green', val: stats.total_attempts || 2500, label: 'Ishlangan testlar' },
              { icon: <IconBooks size={24} />, cls: 'amber', val: stats.total_subjects || 12, label: 'Fanlar' },
            ].map((s, i) => (
              <div key={i} className="stat-item">
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div className="stat-value">{s.val.toLocaleString()}+</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="section" id="fanlar">
        <div className="container">
          <div className="section-header">
            <div className="section-label"><IconBooks size={16} /> Fanlar</div>
            <h2 className="section-title">Fanlar va Testlar</h2>
            <p className="section-desc">DTM va attestatsiya uchun barcha fanlar bo&apos;yicha professional testlar</p>
          </div>

          <div className="subjects-grid">
            {subjects.map(s => (
              <div key={s.id} className="subject-card" onClick={() => loadTests(s.id)}>
                <div className="subject-card-icon"><SubjectIcon icon={s.icon} size={52} /></div>
                <h3>{s.name}</h3>

                {expanded === s.id && tests[s.id] && (
                  <div className="subject-tests-list">
                    {tests[s.id].length === 0 ? (
                      <p style={{ fontSize: '14px', color: 'var(--text-500)', padding: '8px 0' }}>Hozircha testlar mavjud emas</p>
                    ) : (
                      tests[s.id].map(t => (
                        <div key={t.id} className="test-row">
                          <div className="test-row-info">
                            <div className="test-row-dot" />
                            <div>
                              <div className="test-row-name">{t.title}</div>
                              <div className="test-row-meta">{t.question_count} savol · {t.duration_minutes} daq</div>
                            </div>
                          </div>
                          <div className={`test-row-price ${t.price === 0 ? 'free' : ''}`}>{fmt(t.price)}</div>
                        </div>
                      ))
                    )}
                    <div className="subject-card-cta">
                      <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm"
                         onClick={e => e.stopPropagation()}>
                        <IconBrandTelegram size={16} /> Sotib olish
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {subjects.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-500)' }}>
                <IconBooks size={48} style={{ opacity: 0.3, marginBottom: '12px' }} /><br />
                Fanlar yuklanmoqda...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="qanday" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label"><IconBolt size={16} /> Jarayon</div>
            <h2 className="section-title">Qanday Ishlaydi?</h2>
            <p className="section-desc">4 ta oddiy qadamda testni ishlashni boshlang</p>
          </div>

          <div className="steps-grid">
            {[
              { num: <IconBooks size={24} />, title: 'Fanni Tanlang', desc: 'Saytda yoki botda kerakli fan va testni ko\'ring' },
              { num: <IconCreditCard size={24} />, title: 'To\'lov Qiling', desc: 'Karta orqali to\'lab chek screenshotini yuboring' },
              { num: <IconClipboardCheck size={24} />, title: 'Testni Ishlang', desc: 'Telegram bot orqali qulay interfeys bilan ishlang' },
              { num: <IconChartBar size={24} />, title: 'Natijani Ko\'ring', desc: 'Har bir javobingiz tahlili bilan natijani oling' },
            ].map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">
                  <div className="step-num-inner">{s.num}</div>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="imkoniyatlar">
        <div className="container">
          <div className="section-header">
            <div className="section-label"><IconTarget size={16} /> Imkoniyatlar</div>
            <h2 className="section-title">Nima Uchun TestFull?</h2>
            <p className="section-desc">Eng qulay va samarali tayyorlanish muhitini taqdim etamiz</p>
          </div>

          <div className="features-grid">
            {[
              { icon: <IconDeviceMobile size={26} />, cls: 'purple', title: 'Telegram Bot', desc: 'Qulay bot orqali istalgan vaqtda, istalgan joyda test ishlang' },
              { icon: <IconBolt size={26} />, cls: 'cyan', title: 'Tezkor Tekshirish', desc: 'Javoblaringiz bir zumda tekshiriladi va batafsil natija ko\'rsatiladi' },
              { icon: <IconChartBar size={26} />, cls: 'green', title: 'Batafsil Tahlil', desc: 'Har bir savol bo\'yicha to\'g\'ri va noto\'g\'ri javoblar tahlili' },
              { icon: <IconTarget size={26} />, cls: 'amber', title: 'DTM Formati', desc: 'Haqiqiy DTM va attestatsiya formatida professional testlar' },
              { icon: <IconCreditCard size={26} />, cls: 'rose', title: 'Oson To\'lov', desc: 'Plastik karta orqali qulay va xavfsiz to\'lov tizimi' },
              { icon: <IconBooks size={26} />, cls: 'blue', title: 'Ko\'p Fanlar', desc: 'Barcha DTM fanlari bo\'yicha doimiy yangilanib turadigan testlar' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className={`feature-icon-wrap ${f.cls}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <div className="cta-box">
            <div className="cta-content">
              <h2 className="cta-title">Hoziroq Tayyorlanishni Boshlang!</h2>
              <p className="cta-desc">
                Minglab abituriyentlar TestFull platformasidan foydalanib, DTMga muvaffaqiyatli tayyorlanmoqda
              </p>
              <div className="cta-buttons">
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                  <IconBrandTelegram size={20} /> Telegram Bot
                </a>
                <a href="#fanlar" className="btn btn-secondary btn-lg">
                  Testlarni ko&apos;rish
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <span className="footer-copy">&copy; 2024 TestFull. Barcha huquqlar himoyalangan.</span>
            <div className="footer-links">
              <a href={BOT_URL} target="_blank" rel="noopener noreferrer">Telegram Bot</a>
              <a href="#fanlar">Fanlar</a>
              <a href="#imkoniyatlar">Imkoniyatlar</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
