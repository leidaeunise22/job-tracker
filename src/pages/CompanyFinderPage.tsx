import { useEffect, useRef, useState } from 'react'
import { MapPin, Search, BookmarkPlus, CheckCircle2, ExternalLink, X, Building2, Globe } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSavedCities, getSavedCompanies, saveCompany } from '../services/firestore'
import type { SavedCity, Company } from '../types'
import { SEED_CITIES } from '../data/cities'
import { SEED_COMPANIES } from '../data/companies'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useToast } from '../components/ui/Toast'

interface ClearbitCompany {
  name: string
  domain: string
  logo: string
}

const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: 'Space & Aerospace',  keywords: ['aerospace', 'space', 'satellite', 'spacecraft', 'spaceflight', 'rocket', 'orbital'] },
  { label: 'Defense',            keywords: ['defense', 'military', 'government', 'contractor', 'fort bliss', 'dod', 'classified'] },
  { label: 'AI / ML',            keywords: ['ai', 'machine learning', 'ml ', 'deep learning', 'nlp', 'research engineer', 'llm', 'computer vision'] },
  { label: 'Fintech',            keywords: ['fintech', 'payments', 'banking', 'neobank', 'lending', 'financial', 'quant'] },
  { label: 'Gaming',             keywords: ['gaming', 'game dev', 'gameplay', 'unreal', 'engine programmer', 'game server', 'graphics engineer'] },
  { label: 'Cloud / DevOps',     keywords: ['cloud', 'devops', 'sre', 'site reliability', 'infrastructure', 'kubernetes', 'platform engineer'] },
  { label: 'Cybersecurity',      keywords: ['security', 'cybersecurity', 'threat', 'malware', 'identity', 'cryptograph'] },
  { label: 'Semiconductors',     keywords: ['semiconductor', 'chip', 'vlsi', 'soc', 'cpu', 'gpu', 'analog', 'modem', 'fpga'] },
  { label: 'Embedded / HW',      keywords: ['firmware', 'embedded', 'iot', 'microcontroller', 'hardware engineer', 'embedded systems'] },
  { label: 'Health / Bio',       keywords: ['health', 'medical', 'pharma', 'biotech', 'bioinformatics', 'clinical', 'dexcom', 'cochlear'] },
  { label: 'E-commerce',         keywords: ['e-commerce', 'marketplace', 'retail', 'delivery', 'logistics', 'shopping'] },
  { label: 'Autonomous / EV',    keywords: ['autonomous', 'self-driving', 'autopilot', 'ev ', 'electric vehicle', 'lidar', 'robotics'] },
]

const WORK_STYLE_COLORS: Record<string, string> = {
  Onsite: 'bg-slate-100 text-slate-600',
  Hybrid: 'bg-blue-50 text-blue-600',
  Remote: 'bg-emerald-50 text-emerald-700',
}

function companyMatchesQuery(co: Company, query: string, categoryKeywords: string[]): boolean {
  const haystack = [
    co.name, co.industry, co.city, co.state,
    co.whyGoodForNewGrads, ...co.entryLevelRoles,
  ].join(' ').toLowerCase()
  const qTrim = query.trim().toLowerCase()
  if (qTrim && !haystack.includes(qTrim)) return false
  if (categoryKeywords.length > 0 && !categoryKeywords.some((kw) => haystack.includes(kw))) return false
  return true
}

export function CompanyFinderPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [savedCities, setSavedCities] = useState<SavedCity[]>([])
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set())
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [liveResults, setLiveResults] = useState<ClearbitCompany[]>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.allSettled([
      getSavedCities(user.uid),
      getSavedCompanies(user.uid),
    ]).then(([citiesRes, cosRes]) => {
      if (citiesRes.status === 'fulfilled') setSavedCities(citiesRes.value)
      if (cosRes.status === 'fulfilled') {
        setTrackedIds(new Set(cosRes.value.map((c) => c.companyId).filter(Boolean)))
      }
      setLoading(false)
    })
  }, [user])

  // debounced live search — only fires on text queries (not category-only)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 2) { setLiveResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLiveLoading(true)
      try {
        const res = await fetch(
          `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`
        )
        if (!res.ok) throw new Error()
        const data: ClearbitCompany[] = await res.json()
        // filter out companies already in seed data
        const seededNames = new Set(SEED_COMPANIES.map((c) => c.name.toLowerCase()))
        setLiveResults(data.filter((c) => !seededNames.has(c.name.toLowerCase())))
      } catch {
        setLiveResults([])
      } finally {
        setLiveLoading(false)
      }
    }, 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const savedCityNames = new Set(
    savedCities
      .map((sc) => (SEED_CITIES.find((c) => c.id === sc.cityId) ?? sc.cityData)?.name?.toLowerCase())
      .filter((n): n is string => !!n),
  )

  const categoryKeywords = activeCategory
    ? (CATEGORIES.find((c) => c.label === activeCategory)?.keywords ?? [])
    : []

  const hasFilter = query.trim().length > 0 || activeCategory !== null

  const allResults = hasFilter
    ? SEED_COMPANIES.filter((co) => companyMatchesQuery(co, query, categoryKeywords))
    : []

  const inSavedCities = allResults
    .filter((co) => savedCityNames.has(co.city.toLowerCase()))
    .sort((a, b) => b.newGradScore - a.newGradScore)

  const elsewhere = allResults
    .filter((co) => !savedCityNames.has(co.city.toLowerCase()))
    .sort((a, b) => b.newGradScore - a.newGradScore)

  async function handleTrack(co: Company) {
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
    }).catch(() => null)
    if (id) setTrackedIds((prev) => new Set([...prev, co.id]))
    setTrackingId(null)
    toast(id ? `${co.name} added to Companies` : 'Could not save — check connection')
  }

  async function handleTrackLive(co: ClearbitCompany) {
    if (!user || trackedIds.has(co.domain)) return
    setTrackingId(co.domain)
    const id = await saveCompany(user.uid, {
      companyId: co.domain,
      companyName: co.name,
      offices: [],
      industry: '',
      notes: '',
      priority: 'Medium',
      hasApplied: false,
      careerPageUrl: `https://${co.domain}`,
      interviewRounds: [],
    }).catch(() => null)
    if (id) setTrackedIds((prev) => new Set([...prev, co.domain]))
    setTrackingId(null)
    toast(id ? `${co.name} added to Companies` : 'Could not save — check connection')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 p-8">
      <LoadingSpinner size="lg" />
    </div>
  )

  const hasSeededResults = allResults.length > 0
  const hasLiveResults = liveResults.length > 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Company Finder</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Search any company — curated picks highlighted first, then live results from the web.
        </p>
      </div>

      {/* Search bar */}
      <div className="card mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'Search any company — "SpaceX", "Stripe", "Palantir"…'}
            className="input pl-9 pr-9 w-full"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setLiveResults([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory((prev) => (prev === cat.label ? null : cat.label))}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                activeCategory === cat.label
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!hasFilter ? (
        <div className="card text-center py-12">
          <Building2 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm font-medium">Search any company or pick a category</p>
          <p className="text-slate-400 text-xs mt-1">Curated picks show first, then live results for anything else.</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Curated: saved-city matches */}
          {inSavedCities.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  In your saved cities
                  <span className="ml-1.5 text-xs font-normal text-slate-400">({inSavedCities.length})</span>
                </h2>
              </div>
              <div className="space-y-2">
                {inSavedCities.map((co) => (
                  <CompanyCard
                    key={co.id}
                    company={co}
                    savedCityBadge
                    isTracked={trackedIds.has(co.id)}
                    isTracking={trackingId === co.id}
                    onTrack={handleTrack}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Curated: other locations */}
          {elsewhere.length > 0 && (
            <section>
              {inSavedCities.length > 0 && (
                <h2 className="text-sm font-semibold text-slate-500 mb-3">
                  Other locations
                  <span className="ml-1.5 text-xs font-normal text-slate-400">({elsewhere.length})</span>
                </h2>
              )}
              <div className="space-y-2">
                {elsewhere.map((co) => (
                  <CompanyCard
                    key={co.id}
                    company={co}
                    savedCityBadge={false}
                    isTracked={trackedIds.has(co.id)}
                    isTracking={trackingId === co.id}
                    onTrack={handleTrack}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Live results from Clearbit */}
          {query.trim().length >= 2 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-500">
                  {hasSeededResults ? 'More companies' : 'Companies'}
                </h2>
                {liveLoading && <LoadingSpinner size="sm" />}
              </div>

              {!liveLoading && !hasLiveResults && (
                <p className="text-xs text-slate-400 px-1">No additional results found.</p>
              )}

              <div className="space-y-2">
                {liveResults.map((co) => (
                  <LiveCompanyCard
                    key={co.domain}
                    company={co}
                    isTracked={trackedIds.has(co.domain)}
                    isTracking={trackingId === co.domain}
                    onTrack={handleTrackLive}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No results at all */}
          {!hasSeededResults && !liveLoading && !hasLiveResults && query.trim().length >= 2 && (
            <div className="card text-center py-10">
              <p className="text-slate-500 text-sm">No companies found for that search.</p>
              <p className="text-slate-400 text-xs mt-1">Try a different name or keyword.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompanyCard({
  company: co, savedCityBadge, isTracked, isTracking, onTrack,
}: {
  company: Company
  savedCityBadge: boolean
  isTracked: boolean
  isTracking: boolean
  onTrack: (co: Company) => void
}) {
  return (
    <div className={`rounded-2xl border p-4 bg-white transition-all ${
      savedCityBadge ? 'border-indigo-200 shadow-sm shadow-indigo-50' : 'border-slate-100'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-0.5">
            <span className="font-semibold text-slate-900 text-sm">{co.name}</span>
            {savedCityBadge ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium">
                <MapPin size={10} /> {co.city}{co.state ? `, ${co.state}` : ''}
              </span>
            ) : (
              <span className="text-xs text-slate-400">{co.city}{co.state ? `, ${co.state}` : ''}</span>
            )}
            <span className={`badge text-xs ${WORK_STYLE_COLORS[co.workStyle] ?? 'bg-slate-100 text-slate-600'}`}>
              {co.workStyle}
            </span>
          </div>
          <p className="text-xs text-slate-500">{co.industry}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{co.whyGoodForNewGrads}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {co.entryLevelRoles.map((r) => (
              <span key={r} className="badge bg-slate-100 text-slate-600 text-xs">{r}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
          <div className="text-xs font-bold text-indigo-700">{co.newGradScore}/10</div>
          <div className="text-xs text-slate-400">
            ${Math.round(co.salaryRangeMin / 1000)}–${Math.round(co.salaryRangeMax / 1000)}k
          </div>
          {co.careerPageUrl && (
            <a href={co.careerPageUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700">
              Jobs <ExternalLink size={10} />
            </a>
          )}
          <TrackButton isTracked={isTracked} isTracking={isTracking} onClick={() => onTrack(co)} />
        </div>
      </div>
    </div>
  )
}

function LiveCompanyCard({
  company: co, isTracked, isTracking, onTrack,
}: {
  company: ClearbitCompany
  isTracked: boolean
  isTracking: boolean
  onTrack: (co: ClearbitCompany) => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-100 p-4 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {co.logo && !imgError ? (
            <img
              src={co.logo}
              alt={co.name}
              onError={() => setImgError(true)}
              className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Building2 size={14} className="text-slate-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{co.name}</p>
            <a
              href={`https://${co.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500"
            >
              {co.domain} <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <TrackButton isTracked={isTracked} isTracking={isTracking} onClick={() => onTrack(co)} />
      </div>
    </div>
  )
}

function TrackButton({ isTracked, isTracking, onClick }: {
  isTracked: boolean
  isTracking: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={isTracked || isTracking}
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all shrink-0 ${
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
  )
}
