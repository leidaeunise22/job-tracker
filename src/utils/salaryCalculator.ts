import type { SalaryBreakdown } from '../types'

// 2024 federal income tax brackets (single filer, above standard deduction)
const FEDERAL_BRACKETS: [number, number][] = [
  [11600,    0.10],
  [35550,    0.12],  // up to $47,150
  [53375,    0.22],  // up to $100,525
  [91425,    0.24],  // up to $191,950
  [51775,    0.32],  // up to $243,725
  [Infinity, 0.35],
]
const STANDARD_DEDUCTION = 14600
const SS_WAGE_BASE = 168600
const FICA_RATE = 0.0765  // 6.2% SS + 1.45% Medicare

// State income tax effective rates for a $65k–$100k earner (2024)
const STATE_TAX: Record<string, number> = {
  // No state income tax
  AK: 0, FL: 0, NV: 0, NH: 0, SD: 0, TN: 0, TX: 0, WA: 0, WY: 0,
  // Flat / low
  AZ: 0.025, CO: 0.044, IL: 0.0495, IN: 0.0315, KY: 0.045,
  MA: 0.050, MI: 0.0425, NC: 0.0475, PA: 0.0307, UT: 0.0485,
  // Graduated / higher
  CA: 0.063, CT: 0.055, GA: 0.055, HI: 0.079, IA: 0.057,
  MD: 0.052, ME: 0.065, MN: 0.070, MO: 0.050, MT: 0.067,
  NJ: 0.055, NY: 0.065, OH: 0.035, OR: 0.087, SC: 0.063,
  VA: 0.058, VT: 0.065, WI: 0.053,
}

// Monthly non-rent expenses by cost-of-living tier
// Source: BLS Consumer Expenditure Survey 2023, adjusted for city tiers
const COL_EXPENSES = {
  'Low':       { groceries: 340, transportation: 300, healthcare: 190, utilities: 140 },
  'Medium':    { groceries: 430, transportation: 380, healthcare: 230, utilities: 175 },
  'High':      { groceries: 560, transportation: 475, healthcare: 275, utilities: 215 },
  'Very High': { groceries: 710, transportation: 610, healthcare: 330, utilities: 265 },
} as const

export function calculateTakeHome(grossSalary: number, state: string): number {
  const taxable = Math.max(0, grossSalary - STANDARD_DEDUCTION)
  let federalTax = 0
  let remaining = taxable
  for (const [size, rate] of FEDERAL_BRACKETS) {
    if (remaining <= 0) break
    const chunk = size === Infinity ? remaining : Math.min(remaining, size)
    federalTax += chunk * rate
    remaining -= chunk
  }
  const stateTax = grossSalary * (STATE_TAX[state] ?? 0.045)
  const fica = Math.min(grossSalary, SS_WAGE_BASE) * FICA_RATE
  return Math.round(grossSalary - federalTax - stateTax - fica)
}

// Find gross salary needed to yield a target annual take-home (Newton-like iteration)
function grossForTakeHome(targetTakeHome: number, state: string): number {
  let gross = targetTakeHome * 1.35
  for (let i = 0; i < 20; i++) {
    const actual = calculateTakeHome(gross, state)
    const delta = targetTakeHome - actual
    if (Math.abs(delta) < 5) break
    gross += delta * 1.4
  }
  return Math.round(gross / 100) * 100
}

interface CostInputs {
  rent: number
  state: string
  costOfLivingLevel?: 'Low' | 'Medium' | 'High' | 'Very High'
}

export function calculateSalaryBreakdown(inputs: CostInputs): SalaryBreakdown {
  const { rent, state, costOfLivingLevel = 'Medium' } = inputs
  const tier = COL_EXPENSES[costOfLivingLevel]

  const utilities = Math.max(tier.utilities, Math.round(rent * 0.10))
  const groceries = tier.groceries
  const transportation = tier.transportation
  const healthcare = tier.healthcare
  const savings = Math.round(rent * 0.4)

  const monthlyMinimum = rent + utilities + groceries + transportation + healthcare
  const monthlyComfortable = monthlyMinimum + savings

  const minimumSalary = grossForTakeHome(monthlyMinimum * 12, state)
  const comfortableSalary = grossForTakeHome(monthlyComfortable * 12, state)
  const takeHomePay = calculateTakeHome(comfortableSalary, state)
  const taxEstimate = comfortableSalary - takeHomePay

  return {
    rent,
    utilities,
    groceries,
    transportation,
    healthcare,
    savings,
    taxEstimate,
    minimumSalary,
    comfortableSalary,
    takeHomePay,
    monthlyTakeHome: Math.round(takeHomePay / 12),
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatSalaryRange(min: number, max: number): string {
  return `${formatCurrency(min)} – ${formatCurrency(max)}`
}
