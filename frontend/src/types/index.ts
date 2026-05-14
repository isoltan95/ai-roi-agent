export interface UseCaseInput {
  sector: string
  department: string
  submitter_name: string
  submitter_email: string
  title: string
  description: string
  ai_types: string[]
  primary_benefit: string
  current_process: string
  pain_points: string
  fte_count: number
  hours_per_week_per_fte: number
  salary_range: string
  error_rate: string
  data_availability: string
  data_types: string[]
  preferred_timeline_months: number
  strategic_priority: string
  beneficiary_count: number
  budget_range: string
}

export interface FinancialMetrics {
  three_year_roi_percentage: number
  payback_period_months: number
  npv_3yr_qar: number
  benefit_cost_ratio: number
  annual_net_benefit_qar: number
}

export interface Risk {
  title: string
  description: string
  likelihood: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  mitigation: string
}

export interface ImplementationPhase {
  phase: string
  duration: string
  activities: string[]
  deliverables: string[]
}

export interface ROIResult {
  automation_percentage: number
  time_reduction_percentage: number
  error_reduction_percentage: number
  implementation_cost_low_qar: number
  implementation_cost_mid_qar: number
  implementation_cost_high_qar: number
  annual_maintenance_cost_qar: number
  annual_labor_savings_qar: number
  annual_error_savings_qar: number
  annual_productivity_savings_qar: number
  annual_other_savings_qar: number
  total_annual_benefits_qar: number
  financial_metrics: FinancialMetrics
  operational_impact: string
  strategic_impact: string
  citizen_impact: string
  vision_2030_alignment: string
  executive_summary: string
  risks: Risk[]
  implementation_phases: ImplementationPhase[]
  recommendations: string
  confidence_level: string
  use_case_input: UseCaseInput
}

export type Language = 'en' | 'ar'
