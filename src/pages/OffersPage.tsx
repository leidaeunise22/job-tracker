import { useEffect, useState } from 'react'
import { Gift, Plus, Trash2, Edit2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getJobOffers, addJobOffer, updateJobOffer, deleteJobOffer } from '../services/firestore'
import type { JobOffer } from '../types'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { formatCurrency, calculateSalaryBreakdown, calculateTakeHome } from '../utils/salaryCalculator'
import { SEED_CITIES } from '../data/cities'

type FormData = Omit<JobOffer, 'id' | 'userId' | 'createdAt'>

const BLANK: FormData = {
  companyName: '', jobTitle: '', city: '', state: '',
  salary: 0, signingBonus: 0, equityPerYear: 0,
  deadline: '', notes: '',
}

function totalComp(o: JobOffer) {
  return o.salary + o.signingBonus + o.equityPerYear
}

export function OffersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<JobOffer | null>(null)
  const [form, setForm] = useState<FormData>(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<JobOffer | null>(null)

  useEffect(() => {
    if (!user) return
    getJobOffers(user.uid)
      .then((data) => setOffers(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  function openAdd() { setEditTarget(null); setForm(BLANK); setModalOpen(true) }
  function openEdit(o: JobOffer) {
    setEditTarget(o)
    const { id: _id, userId: _uid, createdAt: _c, ...rest } = o
    setForm(rest)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.companyName || !form.salary) return
    setSaving(true)
    try {
      if (editTarget) {
        await updateJobOffer(editTarget.id, form)
        setOffers((prev) => prev.map((o) => o.id === editTarget.id ? { ...o, ...form } : o))
        toast('Offer updated')
      } else {
        const id = await addJobOffer(user.uid, form)
        setOffers((prev) => [...prev, { id, userId: user.uid, ...form, createdAt: new Date() }])
        toast(`${form.companyName} offer saved`)
      }
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteJobOffer(deleteTarget.id)
    setOffers((prev) => prev.filter((o) => o.id !== deleteTarget.id))
    toast('Offer removed')
    setDeleteTarget(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 p-8"><LoadingSpinner size="lg" /></div>
  )

  const sorted = [...offers].sort((a, b) => totalComp(b) - totalComp(a))
  const best = sorted[0]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offer Comparison</h1>
          <p className="text-slate-500 text-sm mt-0.5">Compare total comp and real take-home across offers.</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Offer</button>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={<Gift size={26} />}
          title="No offers yet"
          description="Add job offers to compare total comp, after-tax take-home, and cost of living."
          action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add your first offer</button>}
        />
      ) : (
        <div className="space-y-4">
          {/* Comparison table */}
          {sorted.length >= 2 && (
            <div className="card overflow-x-auto">
              <h2 className="font-semibold text-slate-900 mb-4">Side-by-Side Comparison</h2>
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 pb-3 pr-4 uppercase tracking-wide w-44">Metric</th>
                    {sorted.map((o) => (
                      <th key={o.id} className="text-center pb-3 px-3">
                        <span className="font-semibold text-slate-900 block">{o.companyName}</span>
                        <span className="text-xs text-slate-400 font-normal">{o.jobTitle}</span>
                        {o.id === best.id && (
                          <span className="block mt-1 text-xs font-medium text-emerald-600">Best total comp</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { label: 'Base Salary', fn: (o: JobOffer) => formatCurrency(o.salary), bestFn: (o: JobOffer) => o.salary },
                    { label: 'Signing Bonus', fn: (o: JobOffer) => o.signingBonus ? formatCurrency(o.signingBonus) : '—', bestFn: (o: JobOffer) => o.signingBonus },
                    { label: 'Equity / Year', fn: (o: JobOffer) => o.equityPerYear ? formatCurrency(o.equityPerYear) : '—', bestFn: (o: JobOffer) => o.equityPerYear },
                    { label: 'Total Comp', fn: (o: JobOffer) => formatCurrency(totalComp(o)), bestFn: totalComp },
                    { label: 'Take-Home / yr', fn: (o: JobOffer) => formatCurrency(calculateTakeHome(o.salary, o.state)), bestFn: (o: JobOffer) => calculateTakeHome(o.salary, o.state) },
                    { label: 'Take-Home / mo', fn: (o: JobOffer) => formatCurrency(Math.round(calculateTakeHome(o.salary, o.state) / 12)), bestFn: (o: JobOffer) => calculateTakeHome(o.salary, o.state) },
                    {
                      label: 'vs. Comfortable Salary',
                      fn: (o: JobOffer) => {
                        const seedCity = SEED_CITIES.find((c) => c.name.toLowerCase() === o.city.toLowerCase())
                        if (!seedCity) return '—'
                        const bd = calculateSalaryBreakdown({ rent: seedCity.estimatedRent, state: o.state, costOfLivingLevel: seedCity.costOfLivingLevel })
                        const diff = o.salary - bd.comfortableSalary
                        return (diff >= 0 ? '+' : '') + formatCurrency(diff)
                      },
                      bestFn: (o: JobOffer) => {
                        const seedCity = SEED_CITIES.find((c) => c.name.toLowerCase() === o.city.toLowerCase())
                        if (!seedCity) return 0
                        const bd = calculateSalaryBreakdown({ rent: seedCity.estimatedRent, state: o.state, costOfLivingLevel: seedCity.costOfLivingLevel })
                        return o.salary - bd.comfortableSalary
                      },
                    },
                  ].map(({ label, fn, bestFn }) => {
                    const vals = sorted.map(bestFn)
                    const maxVal = Math.max(...vals.map(Number))
                    return (
                      <tr key={label}>
                        <td className="py-3 pr-4 text-xs text-slate-500 font-medium">{label}</td>
                        {sorted.map((o, i) => {
                          const isBest = Number(vals[i]) === maxVal && maxVal > 0
                          const val = fn(o)
                          const isNeg = typeof val === 'string' && val.startsWith('-')
                          return (
                            <td key={o.id} className="py-3 px-3 text-center">
                              <span className={`font-semibold ${isBest ? 'text-indigo-700' : isNeg ? 'text-red-500' : 'text-slate-700'}`}>
                                {val}
                              </span>
                              {isBest && <span className="block text-xs text-indigo-400">Best</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Offer cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {sorted.map((o) => {
              const takeHome = calculateTakeHome(o.salary, o.state)
              const seedCity = SEED_CITIES.find((c) => c.name.toLowerCase() === o.city.toLowerCase())
              const breakdown = seedCity
                ? calculateSalaryBreakdown({ rent: seedCity.estimatedRent, state: o.state, costOfLivingLevel: seedCity.costOfLivingLevel })
                : null
              const surplus = breakdown ? Math.round(takeHome / 12) - (breakdown.rent + breakdown.utilities + breakdown.groceries + breakdown.transportation + breakdown.healthcare + breakdown.savings) : null
              const isBest = o.id === best.id && sorted.length > 1

              return (
                <div key={o.id} className={`card ${isBest ? 'ring-2 ring-emerald-400' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{o.companyName}</h3>
                        {isBest && <span className="badge bg-emerald-50 text-emerald-700 text-xs">Best</span>}
                      </div>
                      <p className="text-xs text-slate-500">{o.jobTitle}{o.city ? ` · ${o.city}${o.state ? `, ${o.state}` : ''}` : ''}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(o)} className="btn-icon"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteTarget(o)} className="btn-icon text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Base Salary</p>
                      <p className="font-bold text-slate-900">{formatCurrency(o.salary)}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3">
                      <p className="text-xs text-indigo-600">Total Comp</p>
                      <p className="font-bold text-indigo-900">{formatCurrency(totalComp(o))}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Take-Home / mo</p>
                      <p className="font-bold text-slate-900">{formatCurrency(Math.round(takeHome / 12))}</p>
                    </div>
                    {surplus !== null && (
                      <div className={`rounded-xl p-3 ${surplus >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <p className={`text-xs ${surplus >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Monthly surplus</p>
                        <p className={`font-bold ${surplus >= 0 ? 'text-emerald-900' : 'text-red-700'}`}>
                          {surplus >= 0 ? '+' : ''}{formatCurrency(surplus)}
                        </p>
                      </div>
                    )}
                  </div>

                  {(o.signingBonus > 0 || o.equityPerYear > 0) && (
                    <div className="flex gap-2 text-xs text-slate-500 mb-3">
                      {o.signingBonus > 0 && <span className="badge bg-slate-100">{formatCurrency(o.signingBonus)} signing</span>}
                      {o.equityPerYear > 0 && <span className="badge bg-slate-100">{formatCurrency(o.equityPerYear)}/yr equity</span>}
                    </div>
                  )}

                  {o.deadline && (
                    <p className="text-xs text-amber-600">Deadline: {new Date(o.deadline).toLocaleDateString()}</p>
                  )}
                  {o.notes && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-xl px-3 py-2">{o.notes}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Offer' : 'Add Offer'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company *</label>
              <input className="input" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Google" />
            </div>
            <div>
              <label className="label">Job Title *</label>
              <input className="input" required value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Software Engineer" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Austin" />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="TX" maxLength={2} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Base Salary *</label>
              <input className="input" type="number" required min={0} value={form.salary || ''} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} placeholder="95000" />
            </div>
            <div>
              <label className="label">Signing Bonus</label>
              <input className="input" type="number" min={0} value={form.signingBonus || ''} onChange={(e) => setForm({ ...form, signingBonus: Number(e.target.value) })} placeholder="10000" />
            </div>
            <div>
              <label className="label">Equity / Year</label>
              <input className="input" type="number" min={0} value={form.equityPerYear || ''} onChange={(e) => setForm({ ...form, equityPerYear: Number(e.target.value) })} placeholder="20000" />
            </div>
          </div>
          <div>
            <label className="label">Decision Deadline</label>
            <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="textarea h-20" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Benefits, team notes, pros/cons…" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <LoadingSpinner size="sm" /> : editTarget ? 'Save Changes' : 'Add Offer'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Offer" size="sm">
        <p className="text-sm text-slate-600 mb-5">Remove the offer from <strong>{deleteTarget?.companyName}</strong>?</p>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="btn-danger flex-1">Remove</button>
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
