import { Container } from '../ui'

const BOT_URL = 'https://t.me/test_market_uzbot'

export default function Footer() {
  return (
    <footer className="py-10 border-t border-white/[0.04]">
      <Container>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-slate-600">&copy; 2024 Test Market. Barcha huquqlar himoyalangan.</span>
          <div className="flex gap-6">
            <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">Telegram Bot</a>
            <a href="#fanlar" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">Fanlar</a>
            <a href="#imkoniyatlar" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">Imkoniyatlar</a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
