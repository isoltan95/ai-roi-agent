import json
import os
from openai import AzureOpenAI
from .models import UseCaseInput, ROIResult, FinancialMetrics
from .npc_structure import SALARY_RANGES

DEPLOYMENT = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")


def _get_client() -> AzureOpenAI:
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-02-01")
    if not endpoint or not api_key:
        raise ValueError("Missing Azure OpenAI configuration. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.")
    return AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
    )

SYSTEM_PROMPT = """You are an expert AI ROI analyst specializing in government digital transformation projects in the Gulf Cooperation Council (GCC) region, particularly Qatar.

You evaluate AI use cases for the National Planning Council (NPC) of Qatar and provide detailed, realistic ROI assessments aligned with Qatar Vision 2030.

CONTEXT:
- Currency: Qatari Riyal (QAR)
- Government AI projects in Qatar typically cost 300K–5M QAR
- Automation rates in government: 25–75% depending on task complexity
- Government AI implementations typically take 6–24 months
- Annual maintenance typically 15–25% of implementation cost
- Realistic payback periods: 18–48 months for government projects

ESTIMATION GUIDELINES:
- Be realistic, not overly optimistic
- Factor in Qatar's digital maturity and government capacity
- Align with Qatar Vision 2030 pillars: Human, Social, Economic, Environmental development
- Consider Arabic language requirements for AI systems
- Account for change management and training costs

Respond ONLY with valid JSON matching the exact schema provided. No markdown, no extra text."""

def _build_user_prompt(inp: UseCaseInput, annual_salary_qar: float) -> str:
    annual_hours = inp.fte_count * inp.hours_per_week_per_fte * 52
    hourly_cost = (inp.fte_count * annual_salary_qar) / (inp.fte_count * 52 * 40)

    return f"""Analyze this AI use case and return a JSON ROI assessment.

USE CASE DETAILS:
- Organization: {inp.sector} > {inp.department}, National Planning Council, Qatar
- Title: {inp.title}
- Description: {inp.description}
- AI Solution Types: {', '.join(inp.ai_types)}
- Primary Benefit Target: {inp.primary_benefit}

CURRENT PROCESS:
- Description: {inp.current_process}
- Pain Points: {inp.pain_points}
- FTEs Involved: {inp.fte_count}
- Hours/week per FTE on this task: {inp.hours_per_week_per_fte}h
- Total hours/year on task: {annual_hours:.0f}h
- Average Annual Salary: {annual_salary_qar:,.0f} QAR/person
- Total Annual Labor Cost on Task: {inp.fte_count * annual_salary_qar:,.0f} QAR
- Current Error Rate: {inp.error_rate}

DATA & IMPLEMENTATION:
- Data Availability: {inp.data_availability}
- Data Types Available: {', '.join(inp.data_types)}
- Preferred Timeline: {inp.preferred_timeline_months} months
- Strategic Priority: {inp.strategic_priority}
- Number of Beneficiaries: {inp.beneficiary_count:,}
- Budget Range: {inp.budget_range}

Return exactly this JSON schema (numbers only, no commas in numbers, no units):
{{
  "automation_percentage": <0.0-1.0>,
  "time_reduction_percentage": <0.0-1.0>,
  "error_reduction_percentage": <0.0-1.0>,
  "implementation_cost_low_qar": <number>,
  "implementation_cost_mid_qar": <number>,
  "implementation_cost_high_qar": <number>,
  "annual_maintenance_cost_qar": <number>,
  "annual_labor_savings_qar": <number>,
  "annual_error_savings_qar": <number>,
  "annual_productivity_savings_qar": <number>,
  "annual_other_savings_qar": <number>,
  "operational_impact": "<2-3 sentence description>",
  "strategic_impact": "<2-3 sentence description>",
  "citizen_impact": "<2-3 sentence description>",
  "vision_2030_alignment": "<2-3 sentence description of alignment with Qatar Vision 2030>",
  "executive_summary": "<4-5 sentence executive summary>",
  "risks": [
    {{"title": "<risk title>", "description": "<description>", "likelihood": "<Low|Medium|High>", "impact": "<Low|Medium|High>", "mitigation": "<mitigation strategy>"}}
  ],
  "implementation_phases": [
    {{"phase": "<Phase name>", "duration": "<duration>", "activities": ["<activity1>", "<activity2>"], "deliverables": ["<deliverable1>"]}}
  ],
  "recommendations": "<3-4 sentence recommendations paragraph>",
  "confidence_level": "<Low|Medium|High>"
}}

Provide at least 4 risks and 4 implementation phases."""


def _calculate_financials(
    ai_data: dict,
    annual_salary_qar: float,
    inp: UseCaseInput,
) -> dict:
    total_annual_benefits = (
        ai_data["annual_labor_savings_qar"]
        + ai_data["annual_error_savings_qar"]
        + ai_data["annual_productivity_savings_qar"]
        + ai_data["annual_other_savings_qar"]
    )
    impl_cost = ai_data["implementation_cost_mid_qar"]
    maint = ai_data["annual_maintenance_cost_qar"]
    discount_rate = 0.08  # 8% government discount rate

    # 3-year NPV
    npv = -impl_cost
    for year in range(1, 4):
        net_cash = total_annual_benefits - maint
        npv += net_cash / ((1 + discount_rate) ** year)

    # Payback period (months)
    monthly_net = (total_annual_benefits - maint) / 12
    payback_months = impl_cost / monthly_net if monthly_net > 0 else 999

    # 3-year ROI
    total_cost_3yr = impl_cost + 3 * maint
    total_benefit_3yr = 3 * total_annual_benefits
    roi_pct = ((total_benefit_3yr - total_cost_3yr) / total_cost_3yr) * 100 if total_cost_3yr > 0 else 0

    # Benefit-cost ratio
    bcr = total_benefit_3yr / total_cost_3yr if total_cost_3yr > 0 else 0

    return {
        "three_year_roi_percentage": round(roi_pct, 1),
        "payback_period_months": round(payback_months, 1),
        "npv_3yr_qar": round(npv),
        "benefit_cost_ratio": round(bcr, 2),
        "annual_net_benefit_qar": round(total_annual_benefits - maint),
        "total_annual_benefits": round(total_annual_benefits),
    }


async def evaluate_roi(inp: UseCaseInput) -> ROIResult:
    annual_salary_qar = SALARY_RANGES.get(inp.salary_range, 240_000)
    client = _get_client()

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": _build_user_prompt(inp, annual_salary_qar)},
    ]

    response = client.chat.completions.create(
        model=DEPLOYMENT,
        messages=messages,
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=4000,
    )

    ai_data = json.loads(response.choices[0].message.content)
    financials = _calculate_financials(ai_data, annual_salary_qar, inp)

    return ROIResult(
        automation_percentage=ai_data["automation_percentage"],
        time_reduction_percentage=ai_data["time_reduction_percentage"],
        error_reduction_percentage=ai_data["error_reduction_percentage"],
        implementation_cost_low_qar=ai_data["implementation_cost_low_qar"],
        implementation_cost_mid_qar=ai_data["implementation_cost_mid_qar"],
        implementation_cost_high_qar=ai_data["implementation_cost_high_qar"],
        annual_maintenance_cost_qar=ai_data["annual_maintenance_cost_qar"],
        annual_labor_savings_qar=ai_data["annual_labor_savings_qar"],
        annual_error_savings_qar=ai_data["annual_error_savings_qar"],
        annual_productivity_savings_qar=ai_data["annual_productivity_savings_qar"],
        annual_other_savings_qar=ai_data["annual_other_savings_qar"],
        total_annual_benefits_qar=financials["total_annual_benefits"],
        financial_metrics=FinancialMetrics(
            three_year_roi_percentage=financials["three_year_roi_percentage"],
            payback_period_months=financials["payback_period_months"],
            npv_3yr_qar=financials["npv_3yr_qar"],
            benefit_cost_ratio=financials["benefit_cost_ratio"],
            annual_net_benefit_qar=financials["annual_net_benefit_qar"],
        ),
        operational_impact=ai_data["operational_impact"],
        strategic_impact=ai_data["strategic_impact"],
        citizen_impact=ai_data["citizen_impact"],
        vision_2030_alignment=ai_data["vision_2030_alignment"],
        executive_summary=ai_data["executive_summary"],
        risks=ai_data["risks"],
        implementation_phases=ai_data["implementation_phases"],
        recommendations=ai_data["recommendations"],
        confidence_level=ai_data["confidence_level"],
        use_case_input=inp,
    )
