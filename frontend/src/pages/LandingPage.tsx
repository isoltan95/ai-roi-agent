import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brain, TrendingUp, FileText, ChevronDown, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'

const STATS = [
  { labelKey: 'stat1', value: '8' },
  { labelKey: 'stat2', value: '40+' },
  { labelKey: 'stat3', value: '12' },
  { labelKey: 'stat4', value: '4' },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Mesh background */}
      <div className="mesh-bg" />
      <div
        className="mesh-orb w-96 h-96 opacity-20"
        style={{
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          top: '10%',
          left: '-5%',
        }}
      />
      <div
        className="mesh-orb w-80 h-80 opacity-15"
        style={{
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
          bottom: '20%',
          right: '5%',
          animationDelay: '-4s',
        }}
      />
      <div
        className="mesh-orb w-64 h-64 opacity-10"
        style={{
          background: 'radial-gradient(circle, #8b172e 0%, transparent 70%)',
          top: '50%',
          right: '20%',
          animationDelay: '-8s',
        }}
      />
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

      <Navbar />

      {/* Hero */}
      <section className="relative z-10 pt-32 pb-24 px-6 max-w-6xl mx-auto text-center">
        {/* NPC badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-npc-gold/40 bg-npc-gold/10 text-npc-gold text-xs font-semibold mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-npc-gold animate-pulse-slow" />
          {t('landing.badge')}
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold text-white leading-tight mb-4"
        >
          {t('landing.title')}
          <br />
          <span className="gradient-text">{t('landing.titleAccent')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t('landing.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button onClick={() => navigate('/evaluate')} className="btn-primary text-base px-8 py-4">
            <Sparkles className="w-5 h-5" />
            {t('landing.startBtn')}
          </button>
          <a href="#features" className="btn-ghost text-base">
            {t('landing.learnMore')}
            <ChevronDown className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20"
        >
          {STATS.map(({ labelKey, value }, i) => (
            <motion.div
              key={labelKey}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="glass-card p-5 text-center"
            >
              <div className="text-3xl font-extrabold gradient-text mb-1">{value}</div>
              <div className="text-xs text-slate-400">{t(`landing.${labelKey}`)}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              titleKey: 'feature1Title',
              descKey: 'feature1Desc',
              color: 'from-ai-purple to-ai-violet',
              glow: 'shadow-glow-purple',
            },
            {
              icon: TrendingUp,
              titleKey: 'feature2Title',
              descKey: 'feature2Desc',
              color: 'from-npc-maroon to-npc-gold',
              glow: 'shadow-glow-maroon',
            },
            {
              icon: FileText,
              titleKey: 'feature3Title',
              descKey: 'feature3Desc',
              color: 'from-ai-cyan to-ai-purple',
              glow: 'shadow-glow-cyan',
            },
          ].map(({ icon: Icon, titleKey, descKey, color, glow }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="glass-card-hover p-8"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 ${glow}`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t(`landing.${titleKey}`)}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{t(`landing.${descKey}`)}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-16 text-center"
        >
          <button
            onClick={() => navigate('/evaluate')}
            className="btn-maroon text-base px-10 py-4"
          >
            <Sparkles className="w-5 h-5" />
            {t('landing.startBtn')}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-6 text-center">
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} National Planning Council, State of Qatar. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
