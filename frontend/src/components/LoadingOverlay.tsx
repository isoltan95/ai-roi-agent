import { motion, AnimatePresence } from 'framer-motion'
import { Brain } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'

export default function LoadingOverlay() {
  const { t } = useTranslation()
  const steps: string[] = t('loading.steps', { returnObjects: true }) as string[]
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1a]/90 backdrop-blur-sm">
      <div className="text-center max-w-md px-6">
        {/* Animated brain icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-ai-purple/40"
              animate={{ scale: [1, 1.6 + i * 0.4], opacity: [0.6, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ai-purple to-ai-cyan flex items-center justify-center shadow-glow-purple">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">{t('loading.title')}</h2>
        <p className="text-slate-400 text-sm mb-8">{t('loading.subtitle')}</p>

        {/* Animated step text */}
        <div className="h-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-ai-cyan text-sm font-medium"
            >
              {steps[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === stepIndex ? 'bg-ai-purple' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
