import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import type { UseCaseInput } from '../../types'

interface Props {
  sectors: Record<string, string[]>
}

export default function Step1Organization({ sectors }: Props) {
  const { t } = useTranslation()
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<UseCaseInput>()

  const selectedSector = watch('sector')
  const departments = selectedSector ? (sectors[selectedSector] ?? []) : []

  return (
    <div className="space-y-6">
      {/* Sector */}
      <div>
        <label className="label">{t('form.sector')} *</label>
        <select
          {...register('sector', { required: true })}
          className={`input-field ${errors.sector ? 'input-error' : ''}`}
        >
          <option value="">{t('form.sectorPlaceholder')}</option>
          {Object.keys(sectors).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.sector && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Department */}
      <div>
        <label className="label">{t('form.department')} *</label>
        <select
          {...register('department', { required: true })}
          className={`input-field ${errors.department ? 'input-error' : ''}`}
          disabled={!selectedSector}
        >
          <option value="">{t('form.departmentPlaceholder')}</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {errors.department && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Submitter Name */}
      <div>
        <label className="label">{t('form.submitterName')} *</label>
        <input
          {...register('submitter_name', { required: true })}
          placeholder={t('form.submitterNamePlaceholder')}
          className={`input-field ${errors.submitter_name ? 'input-error' : ''}`}
        />
        {errors.submitter_name && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="label">{t('form.submitterEmail')} *</label>
        <input
          {...register('submitter_email', {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          })}
          type="email"
          placeholder={t('form.submitterEmailPlaceholder')}
          className={`input-field ${errors.submitter_email ? 'input-error' : ''}`}
        />
        {errors.submitter_email && <p className="text-red-400 text-xs mt-1">{t('form.required')}</p>}
      </div>
    </div>
  )
}
