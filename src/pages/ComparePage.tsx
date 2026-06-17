import { useEffect, useState } from 'react'
import { BarChart3, DollarSign, MapPin, X, Truck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSavedCities } from '../services/firestore'
import type { SavedCity, City } from '../types'
import { SEED_CITIES } from '../data/cities'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ScoreBar } from '../components/ui/ScoreBar'
import { formatCurrency, calculateSalaryBreakdown, calculateTakeHome } from '../utils/salaryCalculator'

export function ComparePage() {
  const { user } = useAuth()
  const [savedCities, setSavedCities] = useState<SavedCity[]>([])
  const [selected, setSelected] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [targetSalaryInput, setTargetSalaryInput] = useState('')
  const [moveType, setMoveType] = useState<'local' | 'regional' | 'cross-country' | 'international'>('regional')

  useEffect(() => {
    if (!user) return
    getSavedCities(user.uid).then((data) => {
      setSavedCities(data)
      setLoading(false)
    })
  }, [user])

  const availableCities = savedCities
    .map((sc) => SEED_CITIES.find((c) => c.id === sc.cityId) ?? sc.cityData)
    .filter((c): c is City => !!c)

  function toggleCity(city: City) {
    setSelected((prev) => {
      if (prev.find((c) => c.id === city.id)) {
        return prev.filter((c) => c.id !== city.id)
      }
      if (prev.length >= 4) return prev
      return [...prev, city]
    })
  }

  const breakdowns = selected.map((c) =>
    calculateSalaryBreakdown({ rent: c.estimatedRent, state: c.state, costOfLivingLevel: c.costOfLivingLevel })
  )
  const targetSalary = targetSalaryInput ? parseInt(targetSalaryInput, 10) : null

  type Row = { label: string; values: string[]; bestIdx: number | null; higherIsBetter: boolean | null }
  const rows: Row[] = selected.length >= 2 ? [
    {
      label: 'Comfortable Salary',
      values: breakdowns.map((b) => formatCurrency(b.comfortableSalary)),
      bestIdx: breakdowns.reduce((bi, b, i) => b.comfortableSalary < breakdowns[bi].comfortableSalary ? i : bi, 0),
      higherIsBetter: false,
    },
    {
      label: 'Minimum Salary',
      values: breakdowns.map((b) => formatCurrency(b.minimumSalary)),
      bestIdx: breakdowns.reduce((bi, b, i) => b.minimumSalary < breakdowns[bi].minimumSalary ? i : bi, 0),
      higherIsBetter: false,
    },
    {
      label: 'Est. Monthly Rent',
      values: selected.map((c) => formatCurrency(c.estimatedRent) + '/mo'),
      bestIdx: selected.reduce((bi, c, i) => c.estimatedRent < selected[bi].estimatedRent ? i : bi, 0),
      higherIsBetter: false,
    },
    {
      label: 'Total Monthly Expenses',
      values: breakdowns.map((b) => formatCurrency(b.rent + b.utilities + b.groceries + b.transportation + b.healthcare + b.savings) + '/mo'),
      bestIdx: breakdowns.reduce((bi, b, i) => {
        const total = (bd: typeof b) => bd.rent + bd.utilities + bd.groceries + bd.transportation + bd.healthcare + bd.savings
        return total(b) < total(breakdowns[bi]) ? i : bi
      }, 0),
      higherIsBetter: false,
    },
    {
      label: 'Tax Burden',
      values: breakdowns.map((b) => formatCurrency(b.taxEstimate) + '/yr'),
      bestIdx: breakdowns.reduce((bi, b, i) => b.taxEstimate < breakdowns[bi].taxEstimate ? i : bi, 0),
      higherIsBetter: false,
    },
    {
      label: 'New Grad Fit',
      values: selected.map((c) => `${c.newGradFitScore}/10`),
      bestIdx: selected.reduce((bi, c, i) => c.newGradFitScore > selected[bi].newGradFitScore ? i : bi, 0),
      higherIsBetter: true,
    },
    {
      label: 'Job Market',
      values: selected.map((c) => `${c.jobMarketStrength}/10`),
      bestIdx: selected.reduce((bi, c, i) => c.jobMarketStrength > selected[bi].jobMarketStrength ? i : bi, 0),
      higherIsBetter: true,
    },
    ...(targetSalary ? [{
      label: 'Take-Home (your offer)',
      values: selected.map((c) => formatCurrency(calculateTakeHome(targetSalary, c.state)) + '/yr'),
      bestIdx: selected.reduce((bi, c, i) =>
        calculateTakeHome(targetSalary, c.state) > calculateTakeHome(targetSalary, selected[bi].state) ? i : bi, 0),
      higherIsBetter: true,
    }, {
      label: 'Monthly Surplus',
      values: selected.map((c, i) => {
        const surplus = Math.round(calculateTakeHome(targetSalary, c.state) / 12) -
          (breakdowns[i].rent + breakdowns[i].utilities + breakdowns[i].groceries + breakdowns[i].transportation + breakdowns[i].healthcare + breakdowns[i].savings)
        return (surplus >= 0 ? '+' : '') + formatCurrency(surplus) + '/mo'
      }),
      bestIdx: selected.reduce((bi, _c, i) => {
        const surplus = (idx: number) => Math.round(calculateTakeHome(targetSalary, selected[idx].state) / 12) -
          (breakdowns[idx].rent + breakdowns[idx].utilities + breakdowns[idx].groceries + breakdowns[idx].transportation + breakdowns[idx].healthcare + breakdowns[idx].savings)
        return surplus(i) > surplus(bi) ? i : bi
      }, 0),
      higherIsBetter: true,
    }] : []),
  ] : []

  const MOVING_COSTS: Record<string, number> = {
    local: 1200, regional: 2800, 'cross-country': 5500, international: 9500,
  }
  const movingBase = MOVING_COSTS[moveType]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Compare Cities</h1>
        <p className="text-slate-500 text-sm mt-0.5">Select up to 4 saved cities to compare side by side.</p>
      </div>

      {availableCities.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm font-medium">No saved cities to compare</p>
          <p className="text-slate-400 text-xs mt-1">Save cities on the Cities page first.</p>
        </div>
      ) : (
        <>
          {/* City picker */}
          <div className="card mb-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Choose cities to compare</h2>
            <div className="flex flex-wrap gap-2">
              {availableCities.map((city) => {
                const isSelected = !!selected.find((c) => c.id === city.id)
                return (
                  <button
                    key={city.id}
                    onClick={() => toggleCity(city)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <MapPin size={13} />
                    {city.name}, {city.state}
                    {isSelected && <X size={12} className="ml-1" />}
                  </button>
                )
              })}
            </div>
            {selected.length === 4 && (
              <p className="text-xs text-amber-600 mt-2">Maximum 4 cities selected.</p>
            )}
          </div>

          {selected.length < 2 ? (
            <div className="card text-center py-10">
              <p className="text-slate-400 text-sm">Select at least 2 cities to compare.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Salary input */}
              <div className="card flex items-center gap-3">
                <DollarSign size={16} className="text-indigo-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">Salary Analyzer</p>
                  <p className="text-xs text-slate-400">Enter a job offer to compare real take-home across cities</p>
                </div>
                <div className="relative w-40 shrink-0">
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

              {/* Metric comparison table */}
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4 uppercase tracking-wide w-40">
                        Metric
                      </th>
                      {selected.map((c) => (
                        <th key={c.id} className="text-center pb-3 px-3">
                          <span className="font-semibold text-slate-900 block">{c.name}</span>
                          <span className="text-xs text-slate-400 font-normal">{c.state || c.country}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map(({ label, values, bestIdx, higherIsBetter }) => (
                      <tr key={label} className={label === 'Take-Home (your offer)' || label === 'Monthly Surplus' ? 'bg-indigo-50/40' : ''}>
                        <td className="py-3 pr-4 text-xs text-slate-500 font-medium">{label}</td>
                        {values.map((val, i) => (
                          <td key={i} className="py-3 px-3 text-center">
                            <span className={`font-semibold ${
                              i === bestIdx && higherIsBetter !== null
                                ? 'text-indigo-700'
                                : label === 'Monthly Surplus' && val.startsWith('-')
                                ? 'text-red-600'
                                : 'text-slate-700'
                            }`}>
                              {val}
                            </span>
                            {i === bestIdx && higherIsBetter !== null && (
                              <span className="block text-xs text-indigo-400">Best</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td className="py-3 pr-4 text-xs text-slate-500 font-medium">Cost Level</td>
                      {selected.map((c) => (
                        <td key={c.id} className="py-3 px-3 text-center text-xs font-medium text-slate-700">
                          {c.costOfLivingLevel}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Score bars per city */}
              <div className="grid sm:grid-cols-2 gap-4">
                {selected.map((city, i) => (
                  <div key={city.id} className="card">
                    <h3 className="font-semibold text-slate-900 mb-0.5">
                      {city.name}{city.state ? `, ${city.state}` : ''}{city.isCustom && city.country ? `, ${city.country}` : ''}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">{city.costOfLivingLevel} cost of living</p>
                    <div className="space-y-2.5">
                      <ScoreBar score={city.newGradFitScore} label="New Grad Fit" colorClass="bg-indigo-500" />
                      <ScoreBar score={city.jobMarketStrength} label="Job Market" colorClass="bg-emerald-500" />
                      <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Comfortable salary</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(breakdowns[i].comfortableSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax burden</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(breakdowns[i].taxEstimate)}/yr</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. rent</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(city.estimatedRent)}/mo</span>
                        </div>
                        {city.topIndustries.length > 0 && (
                          <div className="flex justify-between">
                            <span>Top industries</span>
                            <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">
                              {city.topIndustries.slice(0, 2).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Relocation cost estimator */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Truck size={16} className="text-slate-500" />
                  <h2 className="font-semibold text-slate-900">Relocation Cost Estimator</h2>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">How far are you moving?</p>
                  <div className="flex flex-wrap gap-2">
                    {(['local', 'regional', 'cross-country', 'international'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setMoveType(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize ${
                          moveType === t
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4 uppercase tracking-wide w-48">Cost</th>
                        {selected.map((c) => (
                          <th key={c.id} className="text-center pb-3 px-3 text-xs font-semibold text-slate-700">
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {([
                        { label: 'Moving / Shipping', fn: () => movingBase },
                        { label: 'Security Deposit', fn: (c: City) => c.estimatedRent * 2 },
                        { label: 'First Month Rent', fn: (c: City) => c.estimatedRent },
                        { label: 'Setup & Misc', fn: () => 1200 },
                      ] as { label: string; fn: (c: City) => number }[]).map(({ label, fn }) => (
                        <tr key={label}>
                          <td className="py-3 pr-4 text-xs text-slate-500 font-medium">{label}</td>
                          {selected.map((c) => (
                            <td key={c.id} className="py-3 px-3 text-center text-sm font-semibold text-slate-700">
                              {formatCurrency(fn(c))}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td className="py-3 pr-4 text-xs font-bold text-slate-700">Total One-Time Cost</td>
                        {selected.map((c) => {
                          const total = movingBase + c.estimatedRent * 2 + c.estimatedRent + 1200
                          return (
                            <td key={c.id} className="py-3 px-3 text-center">
                              <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
                            </td>
                          )
                        })}
                      </tr>
                      {targetSalaryInput && (
                        <tr>
                          <td className="py-3 pr-4 text-xs text-slate-500 font-medium">Months to recover (from surplus)</td>
                          {selected.map((c, i) => {
                            const salary = parseInt(targetSalaryInput, 10)
                            const monthlyTH = Math.round(calculateTakeHome(salary, c.state) / 12)
                            const monthlySurplus = monthlyTH - (breakdowns[i].rent + breakdowns[i].utilities + breakdowns[i].groceries + breakdowns[i].transportation + breakdowns[i].healthcare + breakdowns[i].savings)
                            const reloCost = movingBase + c.estimatedRent * 2 + c.estimatedRent + 1200
                            const months = monthlySurplus > 0 ? Math.ceil(reloCost / monthlySurplus) : null
                            return (
                              <td key={c.id} className="py-3 px-3 text-center">
                                <span className={`font-semibold ${months && months <= 6 ? 'text-emerald-700' : months && months <= 12 ? 'text-amber-600' : 'text-red-500'}`}>
                                  {months !== null ? `${months} mo` : '—'}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-3">Estimates only. Moving costs vary by distance and volume.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
