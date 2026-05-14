import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  Clock,
  DollarSign,
  BarChart2,
  Download,
  Plus,
  AlertTriangle,
  CheckCircle,
  Map,
  Target,
  Zap,
  Users,
  ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { downloadReport } from '../services/api'
import type { ROIResult } from '../types'

const TABS = ['overview', 'financial', 'impact', 'risks', 'roadmap'] as const
type Tab = (typeof TABS)[number]

const LEVEL_BADGE: Record<string, string> = {
  High: 'badge-low',
  Medium: 'badge-medium',
  Low: 'badge-high',
}

const RISK_BADGE: Record<string, string> = {
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
}

const PIE_COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#10b981']
const RATE_TEXT_CLASSES = {
  'ai-purple': 'text-ai-purple',
  'ai-cyan': 'text-ai-cyan',
  'emerald-400': 'text-emerald-400',
} as const
const RATE_BAR_CLASSES = {
  'ai-purple': 'bg-ai-purple',
  'ai-cyan': 'bg-ai-cyan',
  'emerald-400': 'bg-emerald-400',
} as const

function formatQAR(n: number) {
  if (n >= 1_000_000) return `QAR ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `QAR ${(n / 1_000).toFixed(0)}K`
  return `QAR ${n.toFixed(0)}`
}

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  gradient: string
  glow: string
}

function MetricCard({ label, value, icon, gradient, glow }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 border border-white/[0.08] relative overflow-hidden`}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl ${gradient}`}
      />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 ${glow}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-white mb-1 truncate">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </motion.div>
  )
}

export default function ResultsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [result, setResult] = useState<ROIResult | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('roiResult')
    if (!raw) {
      navigate('/evaluate')
      return
    }
    setResult(JSON.parse(raw))
  }, [navigate])

  if (!result) return null

  const fm = result.financial_metrics
  const inp = result.use_case_input

  const benefitPieData = [
    { name: t('results.laborSavings'), value: result.annual_labor_savings_qar },
    { name: t('results.errorSavings'), value: result.annual_error_savings_qar },
    { name: t('results.productivityGains'), value: result.annual_productivity_savings_qar },
    { name: t('results.otherSavings'), value: result.annual_other_savings_qar },
  ].filter((d) => d.value > 0)

  const costBenefitData = [
    {
      name: t('results.costs'),
      value: result.implementation_cost_mid_qar + 3 * result.annual_maintenance_cost_qar,
    },
    { name: t('results.benefits'), value: 3 * result.total_annual_benefits_qar },
  ]

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadReport(result)
      toast.success('Report downloaded successfully!')
    } catch {
      toast.error(t('errors.generic'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="mesh-bg" />
      <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
      <Navbar />

      <div className="relative z-10 pt-24 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${LEVEL_BADGE[result.confidence_level] ?? 'badge-medium'}`}>
                {t('results.confidenceLabel')}: {result.confidence_level}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{inp.title}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {inp.sector} › {inp.department}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/evaluate')}
              className="btn-ghost text-sm py-2.5"
            >
              <Plus className="w-4 h-4" />
              {t('results.newEvaluation')}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-maroon text-sm py-2.5"
            >
              <Download className="w-4 h-4" />
              {downloading ? t('results.downloadingReport') : t('results.downloadReport')}
            </button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            label={t('results.metrics.roi')}
            value={`${fm.three_year_roi_percentage.toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            gradient="from-ai-purple to-ai-violet"
            glow="shadow-glow-purple"
          />
          <MetricCard
            label={t('results.metrics.payback')}
            value={`${fm.payback_period_months.toFixed(1)} ${t('results.units.months')}`}
            icon={<Clock className="w-5 h-5 text-white" />}
            gradient="from-ai-cyan to-ai-purple"
            glow="shadow-glow-cyan"
          />
          <MetricCard
            label={t('results.metrics.npv')}
            value={formatQAR(fm.npv_3yr_qar)}
            icon={<DollarSign className="w-5 h-5 text-white" />}
            gradient="from-emerald-500 to-ai-cyan"
            glow=""
          />
          <MetricCard
            label={t('results.metrics.bcr')}
            value={`${fm.benefit_cost_ratio.toFixed(2)}x`}
            icon={<BarChart2 className="w-5 h-5 text-white" />}
            gradient="from-npc-maroon to-npc-gold"
            glow="shadow-glow-maroon"
          />
          <MetricCard
            label={t('results.metrics.annualBenefit')}
            value={formatQAR(fm.annual_net_benefit_qar)}
            icon={<Zap className="w-5 h-5 text-white" />}
            gradient="from-ai-violet to-ai-purple"
            glow=""
          />
          <MetricCard
            label={t('results.metrics.totalBenefits')}
            value={formatQAR(result.total_annual_benefits_qar)}
            icon={<Target className="w-5 h-5 text-white" />}
            gradient="from-npc-gold to-amber-500"
            glow=""
          />
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 mb-6 glass-card p-1.5 w-full">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-max px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === tab
                  ? 'bg-ai-purple text-white shadow-glow-purple/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {t(`results.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Rates row */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t('results.automation'), value: result.automation_percentage, color: 'ai-purple' },
                  { label: t('results.timeReduction'), value: result.time_reduction_percentage, color: 'ai-cyan' },
                  { label: t('results.errorReduction'), value: result.error_reduction_percentage, color: 'emerald-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass-card p-5 text-center">
                    <div className={`text-3xl font-extrabold mb-1 ${RATE_TEXT_CLASSES[color as keyof typeof RATE_TEXT_CLASSES]}`}>
                      {(value * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${RATE_BAR_CLASSES[color as keyof typeof RATE_BAR_CLASSES]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${value * 100}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Executive Summary */}
              <div className="glass-card p-6">
                <h2 className="section-title mb-3">{t('results.executiveSummary')}</h2>
                <p className="text-slate-300 text-sm leading-relaxed">{result.executive_summary}</p>
              </div>

              {/* Charts row */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Benefit Breakdown Pie */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-bold text-white mb-4">{t('results.benefitBreakdown')}</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={benefitPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {benefitPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                      />
                      <Tooltip
                        formatter={(v: number) => formatQAR(v)}
                        contentStyle={{
                          background: '#0d1b3e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          color: '#e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 3yr Cost vs Benefit Bar */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-bold text-white mb-4">{t('results.costsVsBenefits')}</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={costBenefitData} barCategoryGap="40%">
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v: number) => formatQAR(v)}
                        contentStyle={{
                          background: '#0d1b3e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          color: '#e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        <Cell fill="#8b172e" />
                        <Cell fill="#6366f1" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── FINANCIAL ── */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Costs */}
              <div className="glass-card p-6">
                <h2 className="section-title mb-4">{t('results.implementationCost')}</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Conservative', value: result.implementation_cost_low_qar },
                    { label: 'Mid-Range', value: result.implementation_cost_mid_qar },
                    { label: 'High Estimate', value: result.implementation_cost_high_qar },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-4 bg-white/[0.03] rounded-xl border border-white/[0.07]">
                      <div className="text-xs text-slate-500 mb-1">{label}</div>
                      <div className="text-lg font-bold text-white">{formatQAR(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annual savings table */}
              <div className="glass-card p-6 overflow-x-auto">
                <h2 className="section-title mb-4">Annual Benefits Breakdown</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left text-slate-400 font-medium pb-3">Category</th>
                      <th className="text-right text-slate-400 font-medium pb-3">Annual Value</th>
                      <th className="text-right text-slate-400 font-medium pb-3">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {[
                      { label: t('results.laborSavings'), value: result.annual_labor_savings_qar },
                      { label: t('results.errorSavings'), value: result.annual_error_savings_qar },
                      { label: t('results.productivityGains'), value: result.annual_productivity_savings_qar },
                      { label: t('results.otherSavings'), value: result.annual_other_savings_qar },
                    ].map(({ label, value }) => (
                      <tr key={label}>
                        <td className="py-3 text-slate-300">{label}</td>
                        <td className="py-3 text-right font-semibold text-white">{formatQAR(value)}</td>
                        <td className="py-3 text-right text-slate-400">
                          {result.total_annual_benefits_qar > 0
                            ? ((value / result.total_annual_benefits_qar) * 100).toFixed(1)
                            : '0'}%
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-ai-purple/30">
                      <td className="pt-3 font-bold text-white">Total Annual Benefits</td>
                      <td className="pt-3 text-right font-bold gradient-text">
                        {formatQAR(result.total_annual_benefits_qar)}
                      </td>
                      <td className="pt-3 text-right font-bold text-white">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="glass-card p-6">
                <h2 className="section-title mb-1">{t('results.annualMaintenance')}</h2>
                <div className="text-3xl font-extrabold text-ai-cyan">
                  {formatQAR(result.annual_maintenance_cost_qar)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Per year after go-live</p>
              </div>
            </div>
          )}

          {/* ── IMPACT ── */}
          {activeTab === 'impact' && (
            <div className="space-y-5">
              {[
                { icon: <Zap className="w-5 h-5 text-white" />, title: t('results.operationalImpact'), text: result.operational_impact, color: 'from-ai-purple to-ai-violet' },
                { icon: <TrendingUp className="w-5 h-5 text-white" />, title: t('results.strategicImpact'), text: result.strategic_impact, color: 'from-npc-maroon to-npc-gold' },
                { icon: <Users className="w-5 h-5 text-white" />, title: t('results.citizenImpact'), text: result.citizen_impact, color: 'from-ai-cyan to-ai-purple' },
                { icon: <Target className="w-5 h-5 text-white" />, title: t('results.vision2030'), text: result.vision_2030_alignment, color: 'from-emerald-500 to-ai-cyan' },
              ].map(({ icon, title, text, color }) => (
                <div key={title} className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                      {icon}
                    </div>
                    <h3 className="text-base font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
                </div>
              ))}

              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ai-purple to-npc-maroon flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white">{t('results.recommendations')}</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{result.recommendations}</p>
              </div>
            </div>
          )}

          {/* ── RISKS ── */}
          {activeTab === 'risks' && (
            <div className="space-y-4">
              {result.risks.map((risk, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-npc-maroon flex-shrink-0" />
                      <h3 className="font-semibold text-white text-sm">{risk.title}</h3>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={RISK_BADGE[risk.likelihood] ?? 'badge-medium'}>
                        {t('results.risks.likelihood')}: {risk.likelihood}
                      </span>
                      <span className={RISK_BADGE[risk.impact] ?? 'badge-medium'}>
                        {t('results.risks.impact')}: {risk.impact}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mb-3">{risk.description}</p>
                  <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-300 text-xs">{risk.mitigation}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── ROADMAP ── */}
          {activeTab === 'roadmap' && (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-ai-purple to-ai-cyan opacity-30" />

              {result.implementation_phases.map((phase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-14 pb-8"
                >
                  {/* Circle marker */}
                  <div className="absolute left-3 top-4 w-6 h-6 rounded-full bg-gradient-to-br from-ai-purple to-ai-cyan flex items-center justify-center text-white text-xs font-bold shadow-glow-purple/30">
                    {i + 1}
                  </div>

                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white">{phase.phase}</h3>
                      <span className="text-xs text-ai-cyan border border-ai-cyan/30 px-2 py-0.5 rounded-full">
                        {phase.duration}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {phase.activities?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 mb-2">
                            {t('results.phases.activities')}
                          </p>
                          <ul className="space-y-1">
                            {phase.activities.map((act, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                                <Map className="w-3 h-3 text-ai-purple flex-shrink-0 mt-0.5" />
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {phase.deliverables?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 mb-2">
                            {t('results.phases.deliverables')}
                          </p>
                          <ul className="space-y-1">
                            {phase.deliverables.map((d, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom actions */}
        <div className="flex justify-center gap-4 mt-10 pt-8 border-t border-white/[0.06]">
          <button onClick={() => navigate('/evaluate')} className="btn-ghost">
            <Plus className="w-4 h-4" />
            {t('results.newEvaluation')}
          </button>
          <button onClick={handleDownload} disabled={downloading} className="btn-maroon">
            <Download className="w-4 h-4" />
            {downloading ? t('results.downloadingReport') : t('results.downloadReport')}
          </button>
        </div>
      </div>
    </div>
  )
}
