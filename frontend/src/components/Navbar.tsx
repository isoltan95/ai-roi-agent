import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brain } from 'lucide-react'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#050b1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-npc-maroon to-npc-gold flex items-center justify-center shadow-glow-maroon/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-white leading-tight">NPC AI ROI</div>
            <div className="text-[10px] text-slate-400 leading-tight">National Planning Council · Qatar</div>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-4">
          {location.pathname !== '/' && (
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
              {t('nav.home')}
            </Link>
          )}
          <button
            onClick={toggleLang}
            className="px-4 py-2 rounded-lg border border-white/15 text-sm text-slate-300
                       hover:border-white/30 hover:text-white transition-all duration-200"
          >
            {t('nav.language')}
          </button>
        </div>
      </div>
    </nav>
  )
}
