import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Building2, Briefcase, Plus, TrendingUp,
  CheckCircle2, Clock, Star, AlertCircle, Bell, Gift,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSavedCities, getSavedCompanies, getJobApplications } from '../services/firestore'
import type { SavedCity, SavedCompany, JobApplication, ApplicationStatus } from '../types'
import { SEED_CITIES } from '../data/cities'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatCurrency, calculateSalaryBreakdown } from '../utils/salaryCalculator'

const STATUS_ICONS: Record<ApplicationStatus, typeof CheckCircle2> = {
  Interested: Star, Applied: Clock, Interviewing: TrendingUp, Offer: CheckCircle2, Rejected: AlertCircle,
}
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Interested: 'text-slate-500', Applied: 'text-blue-500',
  Interviewing: 'text-amber-500', Offer: 'text-emerald-500', Rejected: 'text-red-400',
}
const STATUS_BAR: Record<ApplicationStatus, string> = {
  Interested: 'bg-slate-400', Applied: 'bg-blue-400',
  Interviewing: 'bg-amber-400', Offer: 'bg-emerald-400', Rejected: 'bg-red-300',
}

export function DashboardPage() {
  const { user } = useAuth()
  const [savedCities, setSavedCities] = useState<SavedCity[]>([])
  const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>([])
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getSavedCities(user.uid),
      getSavedCompanies(user.uid),
      getJobApplications(user.uid),
    ]).then(([cities, companies, applications]) => {
      setSavedCities(cities)
      setSavedCompanies(companies)
      setJobs(applications)
      setLoading(false)
    })
  }, [user])

  const statusCounts = jobs.reduce<Record<ApplicationStatus, number>>(
    (acc, j) => { acc[j.status] = (acc[j.status] ?? 0) + 1; return acc },
    { Interested: 0, Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0 },
  )

  // Follow-up reminders
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const inWeek = new Date(today); inWeek.setDate(inWeek.getDate() + 7)
  const reminders = jobs
    .filter((j) => {
      if (!j.followUpDate) return false
      const d = new Date(j.followUpDate); d.setHours(0, 0, 0, 0)
      return d <= inWeek
    })
    .sort((a, b) => new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime())

  // Stats
  const applied = statusCounts.Applied + statusCounts.Interviewing + statusCounts.Offer + statusCounts.Rejected
  const responseRate = applied > 0
    ? Math.round(((statusCounts.Interviewing + statusCounts.Offer + statusCounts.Rejected) / applied) * 100)
    : null
  const interviewRate = applied > 0
    ? Math.round(((statusCounts.Interviewing + statusCounts.Offer) / applied) * 100)
    : null
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const appThisWeek = jobs.filter((j) => j.createdAt >= weekAgo).length

  const recentJobs = [...jobs]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 p-8"><LoadingSpinner size="lg" /></div>
  )

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Hey, {firstName}</h1>
        <p className="text-slate-500 text-sm mt-1">Here's your job search overview.</p>
      </div>

      {/* Follow-up reminders */}
      {reminders.length > 0 && (
        <div className="card mb-5 border border-amber-200 bg-amber-50/60">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">
              {reminders.length} follow-up{reminders.length > 1 ? 's' : ''} due this week
            </h2>
          </div>
          <div className="space-y-2">
            {reminders.map((j) => {
              const d = new Date(j.followUpDate); d.setHours(0, 0, 0, 0)
              const isOverdue = d < today
              const isDueToday = d.getTime() === today.getTime()
              return (
                <div key={j.id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{j.jobTitle}</p>
                    <p className="text-xs text-slate-500">{j.company}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-700' : 'text-slate-500'}`}>
                      {isOverdue ? 'Overdue' : isDueToday ? 'Today' : d.toLocaleDateString()}
                    </span>
                    <div className="mt-0.5"><StatusBadge status={j.status} size="sm" /></div>
                  </div>
                </div>
              )
            })}
          </div>
          <Link to="/jobs" className="text-xs text-amber-700 font-medium mt-3 block hover:underline">View all applications →</Link>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {(
          [
            { label: 'Saved Cities',  value: savedCities.length,    icon: MapPin,       color: 'bg-indigo-50 text-indigo-600',  to: '/cities' },
            { label: 'Watchlisted',   value: savedCompanies.length, icon: Building2,    color: 'bg-violet-50 text-violet-600',  to: '/companies' },
            { label: 'Applications',  value: jobs.length,           icon: Briefcase,    color: 'bg-blue-50 text-blue-600',      to: '/jobs' },
            { label: 'Offers',        value: statusCounts.Offer,    icon: Gift,         color: 'bg-emerald-50 text-emerald-600', to: '/offers' },
          ] as const
        ).map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="card hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Application pipeline */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Application Pipeline</h2>
            <Link to="/jobs" className="text-xs text-indigo-600 font-medium hover:text-indigo-700">View all</Link>
          </div>
          {jobs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-400 text-sm">No applications yet.</p>
              <Link to="/jobs" className="btn-primary mt-3 text-xs"><Plus size={14} /> Add Application</Link>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {(['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'] as ApplicationStatus[]).map((status) => {
                const Icon = STATUS_ICONS[status]
                const count = statusCounts[status]
                const pct = jobs.length ? Math.round((count / jobs.length) * 100) : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <Icon size={15} className={`shrink-0 ${STATUS_COLORS[status]}`} />
                    <span className="text-sm text-slate-600 w-24 shrink-0">{status}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${STATUS_BAR[status]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
          {recentJobs.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent</h3>
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{job.jobTitle}</p>
                      <p className="text-xs text-slate-500">{job.company}{job.city ? ` · ${job.city}` : ''}</p>
                    </div>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/city-finder" className="btn-secondary w-full justify-start gap-2.5 py-3">
                <MapPin size={16} className="text-indigo-500" /> Find a City
              </Link>
              <Link to="/jobs" className="btn-primary w-full justify-start gap-2.5 py-3">
                <Plus size={16} /> Add Application
              </Link>
              <Link to="/offers" className="btn-secondary w-full justify-start gap-2.5 py-3">
                <Gift size={16} className="text-emerald-500" /> Compare Offers
              </Link>
            </div>
          </div>

          {/* Saved cities */}
          {savedCities.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">Saved Cities</h2>
                <Link to="/cities" className="text-xs text-indigo-600 font-medium">View</Link>
              </div>
              <div className="space-y-2">
                {savedCities.slice(0, 4).map((sc) => {
                  const city = SEED_CITIES.find((c) => c.id === sc.cityId) ?? sc.cityData
                  if (!city) return null
                  const bd = calculateSalaryBreakdown({ rent: city.estimatedRent, state: city.state, costOfLivingLevel: city.costOfLivingLevel })
                  return (
                    <div key={sc.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="text-sm text-slate-700">{city.name}{city.state ? `, ${city.state}` : ''}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{formatCurrency(bd.comfortableSalary)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search stats */}
      {jobs.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Search Analytics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{appThisWeek}</p>
              <p className="text-xs text-slate-500 mt-1">Apps this week</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {responseRate !== null ? `${responseRate}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Response rate</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {interviewRate !== null ? `${interviewRate}%` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Interview rate</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {statusCounts.Applied + statusCounts.Interviewing}
              </p>
              <p className="text-xs text-slate-500 mt-1">Active apps</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
