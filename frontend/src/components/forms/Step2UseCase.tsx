import { useTranslation } from 'react-i18next'
import { useFormContext, Controller } from 'react-hook-form'
import type { UseCaseInput } from '../../types'

const AI_TYPES = [
  'Process Automation',
  'Predictive Analytics',
  'Content Generation',
  'Data Classification',
  'Natural Language Processing',
  'Computer Vision',
  'Decision Support',
  'Conversational AI / Chatbot',
] as const

const PRIMARY_BENEFITS = ['cost', 'efficiency', 'quality', 'service', 'compliance', 'revenue'] as const
const BENEFIT_VALUES: Record<string, string> = {
  cost: 'Cost Reduction',
  efficiency: 'Operational Efficiency',
  quality: 'Quality Improvement',
  service: 'Citizen / Employee Service',
  compliance: 'Compliance & Risk',
  revenue: 'Revenue / Value Generation',
}

export default function Step2UseCase() {
  const { t } = useTranslation()
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<UseCaseInput>()

  const selectedTypes = watch('ai_types') ?? []

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="label">{t('form.useCaseTitle')} *</label>
        <input
          {...register('title', { required: true })}
          placeholder={t('form.useCaseTitlePlaceholder')}
          className={`input-field ${errors.title ? 'input-error' : ''}`}
        />
        {errors.title && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">{t('form.description')} *</label>
        <textarea
          {...register('description', { required: true, minLength: 30 })}
          placeholder={t('form.descriptionPlaceholder')}
          rows={4}
          className={`input-field resize-none ${errors.description ? 'input-error' : ''}`}
        />
        {errors.description && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* AI Types – multi-select pills */}
      <div>
        <label className="label">{t('form.aiTypes')} *</label>
        <Controller
          name="ai_types"
          control={control}
          rules={{
            validate: (v) => (v && v.length > 0) || t('form.required'),
          }}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {AI_TYPES.map((type) => {
                const active = (field.value ?? []).includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const current = field.value ?? []
                      field.onChange(
                        active ? current.filter((t: string) => t !== type) : [...current, type],
                      )
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                      ${active
                        ? 'bg-ai-purple/30 border-ai-purple text-ai-purple shadow-glow-purple/20'
                        : 'bg-white/5 border-white/15 text-slate-400 hover:border-white/30'
                      }`}
                  >
                    {t(`aiTypes.${type}`)}
                  </button>
                )
              })}
            </div>
          )}
        />
        {errors.ai_types && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Primary Benefit */}
      <div>
        <label className="label">{t('form.primaryBenefit')} *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRIMARY_BENEFITS.map((b) => {
            const val = BENEFIT_VALUES[b]
            return (
              <label
                key={b}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200
                  ${watch('primary_benefit') === val
                    ? 'bg-ai-cyan/10 border-ai-cyan/60 text-ai-cyan'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25'
                  }`}
              >
                <input
                  {...register('primary_benefit', { required: true })}
                  type="radio"
                  value={val}
                  className="hidden"
                />
                <span className="text-xs font-medium">{t(`form.primaryBenefitOptions.${b}`)}</span>
              </label>
            )
          })}
        </div>
        {errors.primary_benefit && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>
    </div>
  )
}
