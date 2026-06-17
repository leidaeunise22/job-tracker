import { useEffect, useState } from 'react'
import { Compass, Check, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSavedCities, saveCity } from '../services/firestore'
import { useToast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { GLOBAL_CITIES, PREFERENCES, globalCityToCity, type Region } from '../data/globalCities'

const REGIONS: Region[] = ['Americas', 'Europe', 'Asia', 'Oceania', 'Africa & Middle East']

const COST_TIER_COLORS: Record<string, string> = {
  'Budget':         'bg-emerald-50 text-emerald-700',
  'Moderate':       'bg-amber-50 text-amber-700',
  'Expensive':      'bg-orange-50 text-orange-700',
  'Very Expensive': 'bg-red-50 text-red-700',
}

export function CityFinderPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [savedCityIds, setSavedCityIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedPrefs, setSelectedPrefs] = useState<Set<string>>(new Set())
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)

  useEffect(() => {
    if (!user) return
    getSavedCities(user.uid).then((cities) => {
      setSavedCityIds(new Set(cities.map((c) => c.cityId)))
      setLoading(false)
    })
  }, [user])

  function togglePref(id: string) {
    setSelectedPrefs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const prefIds = [...selectedPrefs] as (keyof typeof GLOBAL_CITIES[0]['scores'])[]

  const ranked = GLOBAL_CITIES
    .filter((c) => !selectedRegion || c.region === selectedRegion)
    .map((c) => {
      const score = prefIds.length
        ? prefIds.reduce((sum, p) => sum + c.scores[p], 0) / prefIds.length
        : Object.values(c.scores).reduce((a, b) => a + b, 0) / Object.values(c.scores).length
      return { city: c, score }
    })
    .sort((a, b) => b.score - a.score)

  async function handleSave(gc: typeof GLOBAL_CITIES[0]) {
    if (!user) return
    setSaving(gc.id)
    try {
      if (gc.seedCityId) {
        // Use the richer SEED_CITIES data when available
        await saveCity(user.uid, gc.seedCityId)
        setSavedCityIds((prev) => new Set([...prev, gc.seedCityId!]))
      } else {
        const cityData = globalCityToCity(gc)
        await saveCity(user.uid, gc.id, '', cityData)
        setSavedCityIds((prev) => new Set([...prev, gc.id]))
      }
      toast(`${gc.name} saved to your cities!`)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const isSaved = (gc: typeof GLOBAL_CITIES[0]) =>
    savedCityIds.has(gc.id) || (gc.seedCityId ? savedCityIds.has(gc.seedCityId) : false)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">City Finder</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Select what matters to you and we'll rank {GLOBAL_CITIES.length} cities worldwide.
        </p>
      </div>

      {/* Preference chips */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-700">What matters to you?</p>
          {selectedPrefs.size > 0 && (
            <button
              onClick={() => setSelectedPrefs(new Set())}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES.map((pref) => {
            const active = selectedPrefs.has(pref.id)
            return (
              <button
                key={pref.id}
                onClick={() => togglePref(pref.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {active && <Check size={12} className="inline mr-1 -mt-0.5" />}
                {pref.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Region filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setSelectedRegion(null)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
            !selectedRegion
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          All regions
        </button>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRegion(r === selectedRegion ? null : r)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
              selectedRegion === r
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {ranked.length} {ranked.length === 1 ? 'city' : 'cities'}
          {selectedPrefs.size > 0 ? ` · ranked by ${selectedPrefs.size} preference${selectedPrefs.size > 1 ? 's' : ''}` : ' · ranked by overall score'}
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="card text-center py-12">
          <Compass size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No cities match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ranked.map(({ city: gc, score }) => {
            const saved = isSaved(gc)
            const isSaving = saving === gc.id
            const matchPct = Math.round(score * 10)

            // Top 3 preferences this city scores highest on
            const topMatches = prefIds.length
              ? [...prefIds].sort((a, b) => gc.scores[b] - gc.scores[a]).slice(0, 3)
              : (Object.entries(gc.scores) as [string, number][])
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([k]) => k)

            const prefLabel = (id: string) =>
              PREFERENCES.find((p) => p.id === id)?.label ?? id

            return (
              <div key={gc.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{gc.name}</h3>
                      <span className={`badge text-xs font-medium ${COST_TIER_COLORS[gc.costTier]}`}>
                        {gc.costTier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{gc.country} · {gc.region}</p>
                  </div>
                  <button
                    onClick={() => !saved && handleSave(gc)}
                    disabled={saved || isSaving}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      saved
                        ? 'bg-emerald-50 text-emerald-600 cursor-default'
                        : 'btn-primary'
                    }`}
                  >
                    {saved ? (
                      <><Check size={12} /> Saved</>
                    ) : isSaving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <><Plus size={12} /> Save</>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{gc.tagline}</p>

                {/* Match score bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">
                      {selectedPrefs.size > 0 ? 'Match score' : 'Overall score'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{matchPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${matchPct}%` }}
                    />
                  </div>
                </div>

                {/* Top matching tags */}
                <div className="flex flex-wrap gap-1.5">
                  {topMatches.map((key) => (
                    <span
                      key={key}
                      className={`badge text-xs ${
                        selectedPrefs.has(key)
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {prefLabel(key)}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
