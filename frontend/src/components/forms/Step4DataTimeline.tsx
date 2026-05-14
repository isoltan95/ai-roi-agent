import { useTranslation } from 'react-i18next'
import { useFormContext, Controller } from 'react-hook-form'
import type { UseCaseInput } from '../../types'

const DATA_AVAILABILITY = [
  'Poor - Little to no structured data',
  'Moderate - Some data available',
  'Good - Substantial data available',
  'Excellent - Rich, well-structured data',
] as const

const DATA_TYPES = [
  { key: 'structured', value: 'Structured Data (databases, spreadsheets)' },
  { key: 'documents', value: 'Documents & PDFs' },
  { key: 'images', value: 'Images / Scans' },
  { key: 'emails', value: 'Emails & Communications' },
  { key: 'forms', value: 'Forms & Surveys' },
  { key: 'geospatial', value: 'Geospatial / GIS Data' },
  { key: 'financial', value: 'Financial Records' },
  { key: 'hr', value: 'HR & Employee Data' },
  { key: 'open', value: 'Open / Public Data' },
] as const

const TIMELINES = [3, 6, 12, 18, 24] as const
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
const PRIORITY_CLASSES: Record<string, string> = {
  Low: 'bg-emerald-500/20 border-emerald-500/70 text-emerald-400',
  Medium: 'bg-yellow-500/20 border-yellow-500/70 text-yellow-400',
  High: 'bg-orange-500/20 border-orange-500/70 text-orange-400',
  Critical: 'bg-red-500/20 border-red-500/70 text-red-400',
}

const BUDGET_OPTIONS = [
  { key: 'small', value: 'Under QAR 500,000' },
  { key: 'medium', value: 'QAR 500,000 – 1,500,000' },
  { key: 'large', value: 'QAR 1,500,000 – 5,000,000' },
  { key: 'xlarge', value: 'Over QAR 5,000,000' },
  { key: 'unknown', value: 'Not yet determined' },
] as const

export default function Step4DataTimeline() {
  const { t } = useTranslation()
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<UseCaseInput>()

  const selectedDataTypes = watch('data_types') ?? []

  return (
    <div className="space-y-6">
      {/* Data Availability */}
      <div data-field="data_availability">
        <label className="label">{t('form.dataAvailability')} *</label>
        <div className="space-y-2">
          {DATA_AVAILABILITY.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
                ${watch('data_availability') === opt
                  ? 'bg-ai-purple/10 border-ai-purple/60 text-ai-purple'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25'
                }`}
            >
              <input
                {...register('data_availability', {
                  validate: (v) => (typeof v === 'string' && v.trim().length > 0) || t('form.required'),
                })}
                type="radio"
                value={opt}
                className="hidden"
              />
              <span className="text-xs font-medium">{t(`dataAvailabilityOptions.${opt}`)}</span>
            </label>
          ))}
        </div>
        {errors.data_availability && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Data Types */}
      <div data-field="data_types">
        <label className="label">{t('form.dataTypes')} *</label>
        <Controller
          name="data_types"
          control={control}
          defaultValue={[]}
          rules={{
            validate: (v) => (v && v.length > 0) || t('form.required'),
          }}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {DATA_TYPES.map(({ key, value }) => {
                const active = (field.value ?? []).includes(value)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const current = field.value ?? []
                      field.onChange(
                        active ? current.filter((v: string) => v !== value) : [...current, value],
                      )
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                      ${active
                        ? 'bg-ai-cyan/20 border-ai-cyan text-ai-cyan'
                        : 'bg-white/5 border-white/15 text-slate-400 hover:border-white/30'
                      }`}
                  >
                    {t(`form.dataTypeOptions.${key}`)}
                  </button>
                )
              })}
            </div>
          )}
        />
        {errors.data_types && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Timeline */}
      <div>
        <label className="label">{t('form.timeline')} *</label>
        <div className="flex gap-2 flex-wrap">
          {TIMELINES.map((m) => (
            <label
              key={m}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all duration-200
                ${watch('preferred_timeline_months') == m
                  ? 'bg-ai-purple/20 border-ai-purple text-ai-purple'
                  : 'bg-white/5 border-white/15 text-slate-400 hover:border-white/30'
                }`}
            >
              <input
                {...register('preferred_timeline_months', {
                  valueAsNumber: true,
                  validate: (v) => Number.isFinite(v) || t('form.required'),
                })}
                type="radio"
                value={m}
                className="hidden"
              />
              <span className="text-sm font-medium">
                {m} {t('results.units.months')}
              </span>
            </label>
          ))}
        </div>
        {errors.preferred_timeline_months && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Strategic Priority */}
      <div>
        <label className="label">{t('form.strategicPriority')} *</label>
        <div className="flex gap-2 flex-wrap">
          {PRIORITIES.map((p) => {
            const isActive = watch('strategic_priority') === p
            return (
              <label
                key={p}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all duration-200
                  ${isActive
                    ? PRIORITY_CLASSES[p]
                    : 'bg-white/5 border-white/15 text-slate-400 hover:border-white/30'
                  }`}
              >
                <input
                  {...register('strategic_priority', {
                    validate: (v) => (typeof v === 'string' && v.trim().length > 0) || t('form.required'),
                  })}
                  type="radio"
                  value={p}
                  className="hidden"
                />
                <span className="text-sm font-medium">{t(`priorityOptions.${p}`)}</span>
              </label>
            )
          })}
        </div>
        {errors.strategic_priority && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Beneficiary count + Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('form.beneficiaryCount')} *</label>
          <input
            {...register('beneficiary_count', { required: true, min: 1, valueAsNumber: true })}
            type="number"
            min={1}
            placeholder={t('form.beneficiaryCountPlaceholder')}
            className={`input-field ${errors.beneficiary_count ? 'input-error' : ''}`}
          />
          {errors.beneficiary_count && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
        </div>

        <div>
          <label className="label">{t('form.budgetRange')} *</label>
          <select
            {...register('budget_range', { required: true })}
            className={`input-field ${errors.budget_range ? 'input-error' : ''}`}
          >
            <option value=""></option>
            {BUDGET_OPTIONS.map(({ key, value }) => (
              <option key={key} value={value}>
                {t(`form.budgetRangeOptions.${key}`)}
              </option>
            ))}
          </select>
          {errors.budget_range && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
        </div>
      </div>
    </div>
  )
}
