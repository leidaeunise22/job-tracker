import { useEffect, useRef, useState } from 'react'
import {
  MapPin, Plus, Trash2, StickyNote, ChevronDown, ChevronUp,
  DollarSign, Home, Star, Search, Globe, Loader2, ExternalLink,
  Building2, BookmarkPlus, CheckCircle2, Sliders,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
  getSavedCities, saveCity, removeSavedCity, updateCityNotes,
  getSavedCompanies, saveCompany, getUserProfile, saveUserProfile,
} from '../services/firestore'
import { searchCities, type GeoCity } from '../services/geocoding'
import type { SavedCity, City, Company, UserProfile } from '../types'
import { DOMAIN_INTERESTS, EXPERIENCE_LEVELS } from '../types'
import { SEED_CITIES } from '../data/cities'
import { SEED_COMPANIES } from '../data/companies'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { ScoreBar } from '../components/ui/ScoreBar'
import { useToast } from '../components/ui/Toast'
import { formatCurrency, calculateSalaryBreakdown, calculateTakeHome } from '../utils/salaryCalculator'

// keyword map for domain → searchable text matching
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'Web / Frontend':       ['frontend', 'full stack', 'web', 'react', 'javascript', 'typescript', 'ux engineer'],
  'Mobile (iOS/Android)': ['ios', 'android', 'mobile', 'flutter', 'swift', 'kotlin'],
  'AI / ML':              ['ml', 'machine learning', 'ai ', 'nlp', 'computer vision', 'deep learning', 'research engineer', 'data scientist', 'llm'],
  'Data Engineering':     ['data engineer', 'data pipeline', 'etl', 'analytics', 'data analyst', 'bi engineer'],
  'Cloud / DevOps':       ['devops', 'cloud', 'sre', 'site reliability', 'platform engineer', 'infrastructure', 'kubernetes', 'devsecops'],
  'Systems & OS':         ['systems engineer', 'compiler', 'runtime', 'operating system', 'low-level', 'cpu architect'],
  'Cybersecurity':        ['security engineer', 'cybersecurity', 'threat', 'malware', 'identity', 'cryptograph', 'pen test', 'soc analyst'],
  'Gaming':               ['game dev', 'gameplay', 'graphics engineer', 'unreal', 'game server', 'shader', 'engine programmer'],
  'Embedded / Firmware':  ['firmware', 'embedded', 'iot', 'microcontroller', 'fpga', 'hardware engineer', 'embedded systems'],
  'Fintech':              ['fintech', 'payments', 'banking', 'neobank', 'lending', 'financial software', 'quant'],
  'Semiconductors':       ['semiconductor', 'vlsi', 'chip', 'soc', 'cpu', 'gpu', 'analog', 'process engineer', 'modem engineer'],
}

function companyMatchesDomains(co: Company, domains: string[]): boolean {
  if (domains.length === 0) return true
  const haystack = [co.industry, ...co.entryLevelRoles, co.whyGoodForNewGrads].join(' ').toLowerCase()
  return domains.some((d) => DOMAIN_KEYWORDS[d]?.some((kw) => haystack.includes(kw)))
}

function matchedDomains(co: Company, domains: string[]): string[] {
  const haystack = [co.industry, ...co.entryLevelRoles, co.whyGoodForNewGrads].join(' ').toLowerCase()
  return domains.filter((d) => DOMAIN_KEYWORDS[d]?.some((kw) => haystack.includes(kw)))
}

const COL_COLORS: Record<City['costOfLivingLevel'], string> = {
  Low: 'bg-emerald-50 text-emerald-700',
  Medium: 'bg-amber-50 text-amber-700',
  High: 'bg-orange-50 text-orange-700',
  'Very High': 'bg-red-50 text-red-700',
}

export function CitiesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [savedCities, setSavedCities] = useState<SavedCity[]>([])
  const [loading, setLoading] = useState(true)
  const [targetSalaryInput, setTargetSalaryInput] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [geoResults, setGeoResults] = useState<GeoCity[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [detailCity, setDetailCity] = useState<City | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteEdit, setNoteEdit] = useState<{ id: string; text: string } | null>(null)

  // profile
  const [profile, setProfile] = useState<UserProfile>({ experienceLevel: 'new-grad', domainInterests: [] })
  const [profileDraft, setProfileDraft] = useState<UserProfile>({ experienceLevel: 'new-grad', domainInterests: [] })
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  // companies already tracked by user
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set())
  const [trackingId, setTrackingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.allSettled([
      getSavedCities(user.uid),
      getUserProfile(user.uid),
      getSavedCompanies(user.uid),
    ]).then(([citiesRes, profRes, cosRes]) => {
      if (citiesRes.status === 'fulfilled') setSavedCities(citiesRes.value)
      if (profRes.status === 'fulfilled' && profRes.value) {
        setProfile(profRes.value)
        setProfileDraft(profRes.value)
      }
      if (cosRes.status === 'fulfilled') {
        setTrackedIds(new Set(cosRes.value.map((c) => c.companyId).filter(Boolean)))
      }
      setLoading(false)
    })
  }, [user])

  async function handleSaveProfile() {
    if (!user) return
    setProfileSaving(true)
    setProfile(profileDraft)
    setProfileOpen(false)
    try {
      await saveUserProfile(user.uid, profileDraft)
      toast('Preferences saved')
    } catch {
      toast('Preferences applied (could not sync to cloud)')
    } finally {
      setProfileSaving(false)
    }
  }

  function toggleDomain(domain: string) {
    setProfileDraft((prev) => ({
      ...prev,
      domainInterests: prev.domainInterests.includes(domain)
        ? prev.domainInterests.filter((d) => d !== domain)
        : [...prev.domainInterests, domain],
    }))
  }

  async function handleTrackCompany(co: Company) {
    if (!user || trackedIds.has(co.id)) return
    setTrackingId(co.id)
    const id = await saveCompany(user.uid, {
      companyId: co.id,
      companyName: co.name,
      offices: [co.city].filter(Boolean),
      industry: co.industry,
      notes: '',
      priority: 'Medium',
      hasApplied: false,
      careerPageUrl: co.careerPageUrl ?? '',
      interviewRounds: [],
    })
    if (id) setTrackedIds((prev) => new Set([...prev, co.id]))
    setTrackingId(null)
    toast(`${co.name} added to Companies`)
  }

  const savedCityIds = new Set(savedCities.map((sc) => sc.cityId))
  const availableCities = SEED_CITIES.filter((c) => !savedCityIds.has(c.id))
  const filteredCities = citySearch.trim()
    ? availableCities.filter((c) =>
        `${c.name} ${c.state}`.toLowerCase().includes(citySearch.trim().toLowerCase()),
      )
    : availableCities

  function handleSearchChange(value: string) {
    setCitySearch(value)
    setGeoResults([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) return
    setGeoLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(value)
      setGeoResults(results.filter((r) => !savedCityIds.has(r.id)))
      setGeoLoading(false)
    }, 400)
  }

  function closeAddModal() {
    setAddModalOpen(false)
    setCitySearch('')
    setGeoResults([])
    setGeoLoading(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  async function handleAddCustomCity(geo: GeoCity) {
    if (!user) return
    const city: City = {
      id: geo.id,
      name: geo.name,
      state: geo.state,
      country: geo.country,
      costOfLivingLevel: 'Medium',
      comfortableSalary: 65000,
      estimatedRent: 1500,
      estimatedMonthlyExpenses: 3000,
      topIndustries: [],
      topCompanies: [],
      newGradFitScore: 5,
      jobMarketStrength: 5,
      isCustom: true,
    }
    const id = await saveCity(user.uid, city.id, '', city)
    setSavedCities((prev) => [
      ...prev,
      { id, userId: user.uid, cityId: city.id, notes: '', savedAt: new Date(), cityData: city },
    ])
    toast(`${city.name} saved!`)
    closeAddModal()
  }

  async function handleAddCity(city: City) {
    if (!user) return
    const id = await saveCity(user.uid, city.id)
    setSavedCities((prev) => [
      ...prev,
      { id, userId: user.uid, cityId: city.id, notes: '', savedAt: new Date() },
    ])
    toast(`${city.name} saved!`)
    closeAddModal()
  }

  async function handleRemove(sc: SavedCity) {
    const city = SEED_CITIES.find((c) => c.id === sc.cityId) ?? sc.cityData
    await removeSavedCity(sc.id)
    setSavedCities((prev) => prev.filter((x) => x.id !== sc.id))
    toast(`${city?.name ?? 'City'} removed`)
  }

  async function handleSaveNote() {
    if (!noteEdit) return
    await updateCityNotes(noteEdit.id, noteEdit.text)
    setSavedCities((prev) =>
      prev.map((sc) => (sc.id === noteEdit.id ? { ...sc, notes: noteEdit.text } : sc)),
    )
    setNoteEdit(null)
    toast('Note saved')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cities</h1>
          <p className="text-slate-500 text-sm mt-0.5">Research and save cities for your job search.</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="btn-primary"
          disabled={availableCities.length === 0}
        >
          <Plus size={16} /> Add City
        </button>
      </div>

      {savedCities.length === 0 ? (
        <EmptyState
          icon={<MapPin size={26} />}
          title="No cities saved yet"
          description="Add cities to compare cost of living, salaries, and top employers."
          action={
            <button onClick={() => setAddModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Add your first city
            </button>
          }
        />
      ) : (
        <>
        {/* Profile / preferences panel */}
        <div className="card mb-4">
          <button
            onClick={() => { setProfileOpen((v) => !v); setProfileDraft(profile) }}
            className="w-full flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <Sliders size={15} className="text-indigo-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-700">Personalize Recommendations</p>
                <p className="text-xs text-slate-400">
                  {profile.domainInterests.length > 0
                    ? `Filtering by: ${profile.domainInterests.join(', ')}`
                    : 'Add your experience & interests to filter companies'}
                </p>
              </div>
            </div>
            {profileOpen ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
          </button>

          {profileOpen && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
              {/* Experience level */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Experience Level</p>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setProfileDraft((p) => ({ ...p, experienceLevel: value }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        profileDraft.experienceLevel === value
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Domain interests */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Domain Interests <span className="font-normal text-slate-400">(select all that apply)</span></p>
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_INTERESTS.map((domain) => {
                    const active = profileDraft.domainInterests.includes(domain)
                    return (
                      <button
                        key={domain}
                        onClick={() => toggleDomain(domain)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {domain}
                      </button>
                    )
                  })}
                </div>
                {profileDraft.domainInterests.length > 0 && (
                  <button
                    onClick={() => setProfileDraft((p) => ({ ...p, domainInterests: [] }))}
                    className="text-xs text-slate-400 hover:text-slate-600 mt-2"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleSaveProfile} disabled={profileSaving} className="btn-primary text-xs">
                  {profileSaving ? 'Saving…' : 'Save Preferences'}
                </button>
                <button onClick={() => setProfileOpen(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Salary analyzer */}
        <div className="card mb-4 flex items-center gap-3">
          <DollarSign size={16} className="text-indigo-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700">Salary Analyzer</p>
            <p className="text-xs text-slate-400">Enter a job offer to see real take-home in each city</p>
          </div>
          <div className="relative shrink-0 w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input
              type="number"
              min={0}
              placeholder="e.g. 85000"
              value={targetSalaryInput}
              onChange={(e) => setTargetSalaryInput(e.target.value)}
              className="input pl-6 pr-2 w-full text-sm"
            />
          </div>
          {targetSalaryInput && (
            <button onClick={() => setTargetSalaryInput('')} className="text-slate-400 hover:text-slate-600 text-xs shrink-0">Clear</button>
          )}
        </div>

        <div className="space-y-3">
          {savedCities.map((sc) => {
            const city = SEED_CITIES.find((c) => c.id === sc.cityId) ?? sc.cityData
            if (!city) return null
            const isExpanded = expandedId === sc.id
            const breakdown = calculateSalaryBreakdown({
              rent: city.estimatedRent,
              state: city.state,
              costOfLivingLevel: city.costOfLivingLevel,
            })
            const cityCompanies = SEED_COMPANIES.filter((co) => co.cityId === city.id)
            const targetSalary = targetSalaryInput ? parseInt(targetSalaryInput, 10) : null
            const takeHome = targetSalary ? calculateTakeHome(targetSalary, city.state) : null
            const monthlyTakeHome = takeHome ? Math.round(takeHome / 12) : null
            const totalMonthlyNeeds = breakdown.rent + breakdown.utilities + breakdown.groceries + breakdown.transportation + breakdown.healthcare + breakdown.savings
            const monthlySurplus = monthlyTakeHome !== null ? monthlyTakeHome - totalMonthlyNeeds : null

            return (
              <div key={sc.id} className="card overflow-hidden">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-slate-900 text-lg">
                        {city.name}{city.state ? `, ${city.state}` : ''}{city.isCustom && city.country ? `, ${city.country}` : ''}
                      </h2>
                      <span className={`badge text-xs font-medium ${COL_COLORS[city.costOfLivingLevel]}`}>
                        {city.costOfLivingLevel} Cost
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <DollarSign size={13} />
                        {formatCurrency(breakdown.comfortableSalary)}/yr needed
                      </span>
                      <span className="flex items-center gap-1">
                        <Home size={13} />
                        {formatCurrency(city.estimatedRent)}/mo rent
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={13} />
                        {city.newGradFitScore}/10 fit score
                      </span>
                    </div>
                    {takeHome !== null && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                          {formatCurrency(takeHome)}/yr take-home · {formatCurrency(monthlyTakeHome!)}/mo
                        </span>
                        {monthlySurplus !== null && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            monthlySurplus >= 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {monthlySurplus >= 0 ? '+' : ''}{formatCurrency(monthlySurplus)}/mo vs. comfortable
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setDetailCity(city)}
                      className="btn-ghost text-xs px-2.5"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sc.id)}
                      className="btn-icon"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={() => handleRemove(sc)}
                      className="btn-icon text-slate-400 hover:text-red-500"
                      aria-label="Remove city"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <ScoreBar score={city.newGradFitScore} label="New Grad Fit" colorClass="bg-indigo-500" />
                  <ScoreBar score={city.jobMarketStrength} label="Job Market" colorClass="bg-emerald-500" />
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    {/* Industries */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Top Industries
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {city.topIndustries.map((ind) => (
                          <span key={ind} className="badge bg-slate-100 text-slate-600 text-xs">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Salary breakdown */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Monthly Budget Estimate
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        {[
                          ['Rent', breakdown.rent],
                          ['Utilities', breakdown.utilities],
                          ['Groceries', breakdown.groceries],
                          ['Transport', breakdown.transportation],
                          ['Healthcare', breakdown.healthcare],
                          ['Savings', breakdown.savings],
                        ].map(([label, val]) => (
                          <div key={label as string} className="bg-slate-50 rounded-xl px-3 py-2">
                            <p className="text-slate-500 text-xs">{label}</p>
                            <p className="font-semibold text-slate-900">{formatCurrency(val as number)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-3 bg-indigo-50 rounded-xl">
                        <p className="text-xs text-indigo-600 font-medium">
                          Comfortable salary: {formatCurrency(breakdown.comfortableSalary)}/yr
                        </p>
                      </div>
                    </div>

                    {/* Companies */}
                    {cityCompanies.length > 0 && (() => {
                      const filtered = cityCompanies.filter((co) =>
                        companyMatchesDomains(co, profile.domainInterests)
                      )
                      const isFiltering = profile.domainInterests.length > 0
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={13} className="text-slate-400" />
                              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                New Grad CS Companies
                              </h3>
                              <span className="text-xs text-slate-400">
                                ({isFiltering ? `${filtered.length} match` : cityCompanies.length})
                              </span>
                            </div>
                            {isFiltering && filtered.length < cityCompanies.length && (
                              <span className="text-xs text-indigo-500 font-medium">
                                {cityCompanies.length - filtered.length} hidden by filters
                              </span>
                            )}
                          </div>

                          {filtered.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">
                              No companies match your selected interests in this city. Try adjusting your preferences.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {filtered.map((co) => {
                                const isTracked = trackedIds.has(co.id)
                                const isTracking = trackingId === co.id
                                const hits = matchedDomains(co, profile.domainInterests)
                                return (
                                  <div key={co.id} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-sm font-semibold text-slate-900">{co.name}</p>
                                          <span className="badge bg-white border border-slate-200 text-slate-500 text-xs">
                                            {co.workStyle}
                                          </span>
                                          {hits.map((h) => (
                                            <span key={h} className="badge bg-indigo-50 text-indigo-600 text-xs">{h}</span>
                                          ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">{co.industry}</p>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{co.whyGoodForNewGrads}</p>
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                          {co.entryLevelRoles.map((r) => (
                                            <span key={r} className="badge bg-slate-100 text-slate-600 text-xs">{r}</span>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="shrink-0 text-right flex flex-col items-end gap-1">
                                        <div className="text-xs font-bold text-indigo-700">{co.newGradScore}/10</div>
                                        <div className="text-xs text-slate-400">
                                          ${Math.round(co.salaryRangeMin / 1000)}–${Math.round(co.salaryRangeMax / 1000)}k
                                        </div>
                                        {co.careerPageUrl && (
                                          <a
                                            href={co.careerPageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            Jobs <ExternalLink size={10} />
                                          </a>
                                        )}
                                        <button
                                          disabled={isTracked || isTracking}
                                          onClick={() => handleTrackCompany(co)}
                                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all ${
                                            isTracked
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                          }`}
                                        >
                                          {isTracked
                                            ? <><CheckCircle2 size={11} /> Tracked</>
                                            : isTracking
                                            ? 'Adding…'
                                            : <><BookmarkPlus size={11} /> Track</>}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Notes */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <StickyNote size={14} className="text-slate-400" />
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Notes
                        </h3>
                      </div>
                      {noteEdit?.id === sc.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="textarea h-20"
                            value={noteEdit.text}
                            onChange={(e) => setNoteEdit({ ...noteEdit, text: e.target.value })}
                            placeholder="Add notes about this city…"
                          />
                          <div className="flex gap-2">
                            <button onClick={handleSaveNote} className="btn-primary text-xs">Save</button>
                            <button onClick={() => setNoteEdit(null)} className="btn-secondary text-xs">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setNoteEdit({ id: sc.id, text: sc.notes })}
                          className="min-h-10 cursor-text text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2 hover:bg-slate-100 transition-colors"
                        >
                          {sc.notes || <span className="italic">Click to add notes…</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        </>
      )}

      {/* Add city modal */}
      <Modal open={addModalOpen} onClose={closeAddModal} title="Add a City">
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search any city in the world…"
              value={citySearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input pl-8 w-full"
              autoFocus
            />
            {geoLoading && (
              <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
            )}
          </div>

          {/* Seed city matches */}
          {filteredCities.length > 0 && (
            <div className="space-y-1.5">
              {citySearch.trim() && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">Curated</p>
              )}
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleAddCity(city)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{city.name}, {city.state}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatCurrency(city.comfortableSalary)}/yr · {city.costOfLivingLevel} cost
                    </p>
                  </div>
                  <Plus size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Worldwide results */}
          {geoResults.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1">
                <Globe size={12} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Worldwide</p>
              </div>
              {geoResults.map((geo) => (
                <button
                  key={geo.id}
                  onClick={() => handleAddCustomCity(geo)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{geo.displayName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Custom city · salary data estimated</p>
                  </div>
                  <Plus size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {citySearch.trim().length >= 2 && !geoLoading && filteredCities.length === 0 && geoResults.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No cities found for "{citySearch}"</p>
          )}

          {!citySearch.trim() && availableCities.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">You've saved all curated cities! Search above to add more.</p>
          )}
        </div>
      </Modal>

      {/* City detail modal */}
      <Modal
        open={!!detailCity}
        onClose={() => setDetailCity(null)}
        title={detailCity ? [detailCity.name, detailCity.state, detailCity.isCustom ? detailCity.country : undefined].filter(Boolean).join(', ') : ''}
        size="lg"
      >
        {detailCity && <CityDetailView city={detailCity} />}
      </Modal>
    </div>
  )
}

function CityDetailView({ city }: { city: City }) {
  const breakdown = calculateSalaryBreakdown({ rent: city.estimatedRent, state: city.state })
  const companies = SEED_COMPANIES.filter((co) => co.cityId === city.id)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-xs text-indigo-600 font-medium">Comfortable Salary</p>
          <p className="text-xl font-bold text-indigo-900">{formatCurrency(breakdown.comfortableSalary)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Minimum Salary</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(breakdown.minimumSalary)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Monthly Budget</h3>
        <div className="space-y-1.5">
          {[
            ['Rent', breakdown.rent],
            ['Utilities', breakdown.utilities],
            ['Groceries', breakdown.groceries],
            ['Transportation', breakdown.transportation],
            ['Healthcare', breakdown.healthcare],
            ['Savings', breakdown.savings],
            ['Est. Tax', breakdown.taxEstimate / 12],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between text-sm py-1 border-b border-slate-50">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium text-slate-900">{formatCurrency(val as number)}</span>
            </div>
          ))}
        </div>
      </div>

      {companies.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Top Companies</h3>
          <div className="space-y-3">
            {companies.map((co) => (
              <div key={co.id} className="border border-slate-100 rounded-xl p-3.5">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{co.name}</p>
                    <p className="text-xs text-slate-500">{co.industry}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge bg-indigo-50 text-indigo-700 text-xs">{co.workStyle}</span>
                    <p className="text-xs text-slate-500 mt-1">Score: {co.newGradScore}/10</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-2">{co.whyGoodForNewGrads}</p>
                <div className="flex flex-wrap gap-1">
                  {co.entryLevelRoles.map((r) => (
                    <span key={r} className="badge bg-slate-100 text-slate-600 text-xs">{r}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {formatCurrency(co.salaryRangeMin)} – {formatCurrency(co.salaryRangeMax)}/yr
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Scores</h3>
        <div className="space-y-2">
          <ScoreBar score={city.newGradFitScore} label="New Grad Fit Score" colorClass="bg-indigo-500" />
          <ScoreBar score={city.jobMarketStrength} label="Job Market Strength" colorClass="bg-emerald-500" />
        </div>
      </div>
    </div>
  )
}
