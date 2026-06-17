export interface City {
  id: string
  name: string
  state: string
  country?: string
  costOfLivingLevel: 'Low' | 'Medium' | 'High' | 'Very High'
  comfortableSalary: number
  estimatedRent: number
  estimatedMonthlyExpenses: number
  topIndustries: string[]
  topCompanies: string[]
  newGradFitScore: number // 1–10
  jobMarketStrength: number // 1–10
  isCustom?: boolean
  notes?: string
}

export interface Company {
  id: string
  name: string
  cityId: string
  city: string
  state: string
  industry: string
  whyGoodForNewGrads: string
  entryLevelRoles: string[]
  salaryRangeMin: number
  salaryRangeMax: number
  workStyle: 'Onsite' | 'Hybrid' | 'Remote'
  newGradScore: number // 1–10
  careerPageUrl?: string
}

export interface SavedCity {
  id: string
  userId: string
  cityId: string
  notes: string
  savedAt: Date
  cityData?: City  // populated for custom cities not in SEED_CITIES
}

export interface InterviewRound {
  id: string
  stage: string
  date: string
  notes: string
  outcome: 'Pending' | 'Passed' | 'Rejected'
}

export interface SavedCompany {
  id: string
  userId: string
  companyId: string
  companyName: string
  offices: string[]
  industry: string
  notes: string
  priority: 'Low' | 'Medium' | 'High'
  hasApplied: boolean
  careerPageUrl: string
  savedAt: Date
  interviewRounds: InterviewRound[]
}

export interface JobOffer {
  id: string
  userId: string
  companyName: string
  jobTitle: string
  city: string
  state: string
  salary: number
  signingBonus: number
  equityPerYear: number
  deadline: string
  notes: string
  createdAt: Date
}

export type ApplicationStatus =
  | 'Interested'
  | 'Applied'
  | 'Interviewing'
  | 'Offer'
  | 'Rejected'

export interface JobApplication {
  id: string
  userId: string
  jobTitle: string
  company: string
  city: string
  applicationUrl: string
  status: ApplicationStatus
  dateApplied: string
  deadline: string
  notes: string
  contactName: string
  followUpDate: string
  createdAt: Date
  updatedAt: Date
}

export const DOMAIN_INTERESTS = [
  'Web / Frontend',
  'Mobile (iOS/Android)',
  'AI / ML',
  'Data Engineering',
  'Cloud / DevOps',
  'Systems & OS',
  'Cybersecurity',
  'Gaming',
  'Embedded / Firmware',
  'Fintech',
  'Semiconductors',
] as const

export const EXPERIENCE_LEVELS = [
  { value: 'student',   label: 'Student / Seeking Internship' },
  { value: 'new-grad',  label: 'New Grad (0–1 yr)' },
  { value: 'early',     label: 'Early Career (1–3 yrs)' },
  { value: 'mid',       label: 'Mid-Level (3–5 yrs)' },
  { value: 'senior',    label: 'Senior (5+ yrs)' },
] as const

export interface UserProfile {
  experienceLevel: string
  domainInterests: string[]
}

export interface SalaryBreakdown {
  rent: number
  utilities: number
  groceries: number
  transportation: number
  healthcare: number
  savings: number
  taxEstimate: number
  minimumSalary: number
  comfortableSalary: number
  takeHomePay: number        // take-home at comfortableSalary
  monthlyTakeHome: number    // take-home / 12
}
