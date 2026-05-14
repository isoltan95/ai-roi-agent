import { useState, useEffect } from 'react'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, FormProvider } from 'react-hook-form'
import type { FieldErrors, FieldPath } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'
import Navbar from '../components/Navbar'
import StepIndicator from '../components/StepIndicator'
import LoadingOverlay from '../components/LoadingOverlay'
import Step1Organization from '../components/forms/Step1Organization'
import Step2UseCase from '../components/forms/Step2UseCase'
import Step3Process from '../components/forms/Step3Process'
import Step4DataTimeline from '../components/forms/Step4DataTimeline'
import { fetchSectors, evaluateROI } from '../services/api'
import type { UseCaseInput, ROIResult } from '../types'

const TOTAL_STEPS = 4

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export default function EvaluatePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const submitInFlight = useRef(false)
  const [sectors, setSectors] = useState<Record<string, string[]>>({})
  const isRTL = i18n.language === 'ar'

  const methods = useForm<UseCaseInput>({
    shouldUnregister: false,
    defaultValues: {
      ai_types: [],
      data_types: [],
      hours_per_week_per_fte: 8,
    },
  })

  useEffect(() => {
    fetchSectors()
      .then(setSectors)
      .catch(() => toast.error(t('errors.network')))
  }, [t])

  const goNext = async () => {
    const valid = await methods.trigger(getFieldsForStep(step))
    if (!valid) return
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 1))
  }

  const onSubmit = async (data: UseCaseInput) => {
    if (submitInFlight.current) return

    const missingFields = getMissingRequiredFields(data)
    if (missingFields.length > 0) {
      for (const field of missingFields) {
        methods.setError(field, { type: 'manual', message: t('form.required') })
      }
      toast.error(missingFields.map(() => t('form.required')).join(' | '))
      return
    }

    submitInFlight.current = true
    setLoading(true)
    try {
      const result: ROIResult = await evaluateROI(data)
      sessionStorage.setItem('roiResult', JSON.stringify(result))
      navigate('/results')
    } catch (err: unknown) {
      let message = t('errors.generic')
      if (axios.isAxiosError(err)) {
        message = formatApiError(err.response?.data?.detail, err.message, message)
      } else if (err instanceof Error) {
        message = err.message
      }
      toast.error(message)
    } finally {
      setLoading(false)
      submitInFlight.current = false
    }
  }

  const onInvalid = (errors: FieldErrors<UseCaseInput>) => {
    const firstInvalid = Object.keys(errors)[0] as FieldPath<UseCaseInput> | undefined
    if (!firstInvalid) {
      toast.error(t('form.required'))
      return
    }

    const byName = document.querySelector(`[name="${firstInvalid}"]`) as HTMLElement | null
    const byField = document.querySelector(`[data-field="${firstInvalid}"]`) as HTMLElement | null
    const target = byName ?? byField

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (typeof (target as HTMLInputElement).focus === 'function') {
        ;(target as HTMLInputElement).focus()
      }
    }

    toast.error(t('form.required'))
  }

  return (
    <div className="min-h-screen relative">
      <div className="mesh-bg" />
      <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />

      {loading && <LoadingOverlay />}

      <Navbar />

      <div className="relative z-10 pt-28 pb-16 px-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {t('nav.evaluate')}
          </h1>
          <p className="text-slate-400 text-sm">
            {t('steps.step' + step as keyof object)} — Step {step} of {TOTAL_STEPS}
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Form card */}
        <div className="glass-card p-8 overflow-hidden">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit, onInvalid)}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={isRTL ? -direction : direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                  {step === 1 && <Step1Organization sectors={sectors} />}
                  {step === 2 && <Step2UseCase />}
                  {step === 3 && <Step3Process />}
                  {step === 4 && <Step4DataTimeline />}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
                {step > 1 ? (
                  <button type="button" onClick={goBack} className="btn-ghost">
                    <ArrowLeft className="w-4 h-4" />
                    {t('form.back')}
                  </button>
                ) : (
                  <div />
                )}

                {step < TOTAL_STEPS ? (
                  <button type="button" onClick={goNext} className="btn-primary">
                    {t('form.next')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-maroon px-8"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('form.submit')}
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}

function getMissingRequiredFields(data: UseCaseInput): (keyof UseCaseInput)[] {
  const missing: (keyof UseCaseInput)[] = []

  const requiredStrings: (keyof UseCaseInput)[] = [
    'sector',
    'department',
    'submitter_name',
    'submitter_email',
    'title',
    'description',
    'primary_benefit',
    'current_process',
    'pain_points',
    'salary_range',
    'error_rate',
    'data_availability',
    'strategic_priority',
    'budget_range',
  ]

  for (const key of requiredStrings) {
    const val = data[key]
    if (typeof val !== 'string' || val.trim().length === 0) {
      missing.push(key)
    }
  }

  if (!Array.isArray(data.ai_types) || data.ai_types.length === 0) missing.push('ai_types')
  if (!Array.isArray(data.data_types) || data.data_types.length === 0) missing.push('data_types')

  if (!Number.isFinite(data.fte_count) || data.fte_count < 1) missing.push('fte_count')
  if (!Number.isFinite(data.hours_per_week_per_fte) || data.hours_per_week_per_fte < 0.5) {
    missing.push('hours_per_week_per_fte')
  }
  if (!Number.isFinite(data.preferred_timeline_months) || data.preferred_timeline_months < 1) {
    missing.push('preferred_timeline_months')
  }
  if (!Number.isFinite(data.beneficiary_count) || data.beneficiary_count < 1) {
    missing.push('beneficiary_count')
  }

  return [...new Set(missing)]
}

function formatApiError(detail: unknown, fallback: string, defaultMsg: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item) {
          const msg = (item as { msg?: unknown }).msg
          return typeof msg === 'string' ? msg : ''
        }
        return ''
      })
      .filter(Boolean)
    if (messages.length > 0) return messages.join(' | ')
  }
  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail)
    } catch {
      return fallback || defaultMsg
    }
  }
  return fallback || defaultMsg
}

function getFieldsForStep(step: number): (keyof UseCaseInput)[] {
  switch (step) {
    case 1:
      return ['sector', 'department', 'submitter_name', 'submitter_email']
    case 2:
      return ['title', 'description', 'ai_types', 'primary_benefit']
    case 3:
      return ['current_process', 'pain_points', 'fte_count', 'hours_per_week_per_fte', 'salary_range', 'error_rate']
    case 4:
      return ['data_availability', 'data_types', 'preferred_timeline_months', 'strategic_priority', 'beneficiary_count', 'budget_range']
    default:
      return []
  }
}
