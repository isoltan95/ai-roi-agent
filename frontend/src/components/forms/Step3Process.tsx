import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import type { UseCaseInput } from '../../types'

const SALARY_OPTIONS = [
  '8,000 - 15,000 QAR/month',
  '15,000 - 25,000 QAR/month',
  '25,000 - 45,000 QAR/month',
  '45,000+ QAR/month',
] as const

const ERROR_RATES = [
  { key: 'low', value: 'Low (< 5%)' },
  { key: 'moderate', value: 'Moderate (5–15%)' },
  { key: 'high', value: 'High (15–30%)' },
  { key: 'very_high', value: 'Very High (> 30%)' },
] as const

export default function Step3Process() {
  const { t } = useTranslation()
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<UseCaseInput>()

  const hoursVal = watch('hours_per_week_per_fte') ?? 8

  return (
    <div className="space-y-6">
      {/* Current Process */}
      <div>
        <label className="label">{t('form.currentProcess')} *</label>
        <textarea
          {...register('current_process', { required: true, minLength: 20 })}
          placeholder={t('form.currentProcessPlaceholder')}
          rows={3}
          className={`input-field resize-none ${errors.current_process ? 'input-error' : ''}`}
        />
        {errors.current_process && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Pain Points */}
      <div>
        <label className="label">{t('form.painPoints')} *</label>
        <textarea
          {...register('pain_points', { required: true, minLength: 20 })}
          placeholder={t('form.painPointsPlaceholder')}
          rows={3}
          className={`input-field resize-none ${errors.pain_points ? 'input-error' : ''}`}
        />
        {errors.pain_points && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* FTE count + hours in a grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('form.fteCount')} *</label>
          <input
            {...register('fte_count', { required: true, min: 1, max: 5000, valueAsNumber: true })}
            type="number"
            min={1}
            placeholder={t('form.fteCountPlaceholder')}
            className={`input-field ${errors.fte_count ? 'input-error' : ''}`}
          />
          {errors.fte_count && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
        </div>

        <div>
          <label className="label">
            {t('form.hoursPerWeek')}: <span className="text-ai-cyan font-bold">{hoursVal}h</span>
          </label>
          <input
            {...register('hours_per_week_per_fte', { required: true, min: 0.5, max: 60, valueAsNumber: true })}
            type="range"
            min={0.5}
            max={40}
            step={0.5}
            className="w-full mt-3 accent-ai-purple"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0.5h</span>
            <span>40h</span>
          </div>
        </div>
      </div>

      {/* Salary Range */}
      <div>
        <label className="label">{t('form.salaryRange')} *</label>
        <select
          {...register('salary_range', { required: true })}
          className={`input-field ${errors.salary_range ? 'input-error' : ''}`}
        >
          <option value=""></option>
          {SALARY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`salaryOptions.${s}`)}
            </option>
          ))}
        </select>
        {errors.salary_range && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Error Rate */}
      <div>
        <label className="label">{t('form.errorRate')} *</label>
        <div className="grid grid-cols-2 gap-2">
          {ERROR_RATES.map(({ key, value }) => (
            <label
              key={key}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200
                ${watch('error_rate') === value
                  ? 'bg-ai-violet/10 border-ai-violet/60 text-ai-violet'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25'
                }`}
            >
              <input
                {...register('error_rate', { required: true })}
                type="radio"
                value={value}
                className="hidden"
              />
              <span className="text-xs font-medium">{t(`form.errorRateOptions.${key}`)}</span>
            </label>
          ))}
        </div>
        {errors.error_rate && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>
    </div>
  )
}
