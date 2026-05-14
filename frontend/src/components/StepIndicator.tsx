import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  currentStep: number
  totalSteps: number
}

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const

export default function StepIndicator({ currentStep, totalSteps }: Props) {
  const { t } = useTranslation()

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-ai-purple to-ai-cyan rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep) / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step circles */}
      <div className="flex items-center justify-between">
        {STEP_KEYS.slice(0, totalSteps).map((key, i) => {
          const stepNum = i + 1
          const isDone = stepNum < currentStep
          const isCurrent = stepNum === currentStep

          return (
            <div key={key} className="flex flex-col items-center gap-2 flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                }}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  transition-colors duration-300 border-2
                  ${isDone
                    ? 'bg-ai-purple border-ai-purple text-white'
                    : isCurrent
                    ? 'bg-ai-purple/20 border-ai-purple text-ai-purple shadow-glow-purple'
                    : 'bg-white/5 border-white/20 text-slate-500'
                  }
                `}
              >
                {isDone ? <Check className="w-4 h-4" /> : stepNum}
              </motion.div>
              <span
                className={`text-[10px] font-medium text-center hidden sm:block
                  ${isCurrent ? 'text-ai-purple' : isDone ? 'text-slate-400' : 'text-slate-600'}`}
              >
                {t(`steps.${key}`)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
