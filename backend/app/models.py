from pydantic import BaseModel, Field
from typing import List, Optional


class UseCaseInput(BaseModel):
    # Organization
    sector: str
    department: str
    submitter_name: str
    submitter_email: str

    # Use Case
    title: str
    description: str
    ai_types: List[str]
    primary_benefit: str

    # Current Process
    current_process: str
    pain_points: str
    fte_count: int = Field(ge=1, le=5000)
    hours_per_week_per_fte: float = Field(ge=0.5, le=60)
    salary_range: str
    error_rate: str

    # Data & Implementation
    data_availability: str
    data_types: List[str]
    preferred_timeline_months: int
    strategic_priority: str
    beneficiary_count: int = Field(ge=1)
    budget_range: str


class FinancialMetrics(BaseModel):
    three_year_roi_percentage: float
    payback_period_months: float
    npv_3yr_qar: float
    benefit_cost_ratio: float
    annual_net_benefit_qar: float


class ROIResult(BaseModel):
    # Quantitative estimates from AI
    automation_percentage: float
    time_reduction_percentage: float
    error_reduction_percentage: float

    # Costs
    implementation_cost_low_qar: float
    implementation_cost_mid_qar: float
    implementation_cost_high_qar: float
    annual_maintenance_cost_qar: float

    # Annual benefits
    annual_labor_savings_qar: float
    annual_error_savings_qar: float
    annual_productivity_savings_qar: float
    annual_other_savings_qar: float
    total_annual_benefits_qar: float

    # Financial
    financial_metrics: FinancialMetrics

    # Qualitative
    operational_impact: str
    strategic_impact: str
    citizen_impact: str
    vision_2030_alignment: str

    # Report content
    executive_summary: str
    risks: List[dict]
    implementation_phases: List[dict]
    recommendations: str
    confidence_level: str

    # Echo input for report
    use_case_input: UseCaseInput
