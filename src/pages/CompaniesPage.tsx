import { useEffect, useRef, useState } from 'react'
import {
  Building2, Plus, Trash2, ExternalLink, Edit2, CheckCircle2, MapPin, X,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
  getSavedCompanies, saveCompany, removeSavedCompany, updateSavedCompany,
} from '../services/firestore'
import type { SavedCompany, InterviewRound } from '../types'
import { SEED_COMPANIES } from '../data/companies'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import { formatCurrency } from '../utils/salaryCalculator'
import { ScoreBar } from '../components/ui/ScoreBar'

type Priority = SavedCompany['priority']

const PRIORITY_STYLES: Record<Priority, string> = {
  High:   'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low:    'bg-slate-100 text-slate-600',
}

type FormData = Omit<SavedCompany, 'id' | 'userId' | 'savedAt'>

const BLANK_FORM: FormData = {
  companyId: '',
  companyName: '',
  offices: [],
  industry: '',
  notes: '',
  priority: 'Medium',
  hasApplied: false,
  careerPageUrl: '',
  interviewRounds: [],
}

export function CompaniesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<SavedCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SavedCompany | null>(null)
  const [form, setForm] = useState<FormData>(BLANK_FORM)
  const [officeInput, setOfficeInput] = useState('')
  const [saving, setSaving] = useState(false)
  const officeInputRef = useRef<HTMLInputElement>(null)

  // Filters
  const [filterApplied, setFilterApplied] = useState<'all' | 'applied' | 'not-applied'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | Priority>('all')

  // Interview rounds
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingRoundFor, setAddingRoundFor] = useState<string | null>(null)
  const BLANK_ROUND: Omit<InterviewRound, 'id'> = { stage: '', date: '', notes: '', outcome: 'Pending' }
  const [roundForm, setRoundForm] = useState(BLANK_ROUND)

  async function handleAddRound(co: SavedCompany) {
    if (!roundForm.stage) return
    const round: InterviewRound = { ...roundForm, id: crypto.randomUUID() }
    const updated = [...co.interviewRounds, round]
    await updateSavedCompany(co.id, { interviewRounds: updated })
    setCompanies((prev) => prev.map((c) => c.id === co.id ? { ...c, interviewRounds: updated } : c))
    setAddingRoundFor(null)
    setRoundForm(BLANK_ROUND)
  }

  async function handleUpdateRoundOutcome(co: SavedCompany, roundId: string, outcome: InterviewRound['outcome']) {
    const updated = co.interviewRounds.map((r) => r.id === roundId ? { ...r, outcome } : r)
    await updateSavedCompany(co.id, { interviewRounds: updated })
    setCompanies((prev) => prev.map((c) => c.id === co.id ? { ...c, interviewRounds: updated } : c))
  }

  async function handleDeleteRound(co: SavedCompany, roundId: string) {
    const updated = co.interviewRounds.filter((r) => r.id !== roundId)
    await updateSavedCompany(co.id, { interviewRounds: updated })
    setCompanies((prev) => prev.map((c) => c.id === co.id ? { ...c, interviewRounds: updated } : c))
  }

  useEffect(() => {
    if (!user) return
    getSavedCompanies(user.uid).then((data) => {
      setCompanies(data)
      setLoading(false)
    })
  }, [user])

  function openAdd() {
    setEditTarget(null)
    setForm(BLANK_FORM)
    setOfficeInput('')
    setModalOpen(true)
  }

  function openEdit(co: SavedCompany) {
    setEditTarget(co)
    const { id: _id, userId: _uid, savedAt: _at, ...rest } = co
    setForm(rest)
    setOfficeInput('')
    setModalOpen(true)
  }

  function addOffice() {
    const val = officeInput.trim()
    if (!val || form.offices.includes(val)) return
    setForm((prev) => ({ ...prev, offices: [...prev.offices, val] }))
    setOfficeInput('')
    officeInputRef.current?.focus()
  }

  function removeOffice(office: string) {
    setForm((prev) => ({ ...prev, offices: prev.offices.filter((o) => o !== office) }))
  }

  function fillFromSeed(companyId: string) {
    const seed = SEED_COMPANIES.find((c) => c.id === companyId)
    if (!seed) return
    const office = `${seed.city}, ${seed.state}`
    setForm((prev) => ({
      ...prev,
      companyId: seed.id,
      companyName: seed.name,
      offices: [office],
      industry: seed.industry,
      careerPageUrl: seed.careerPageUrl ?? '',
    }))
    setOfficeInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.companyName) return
    // commit any pending office input
    const finalOffices = officeInput.trim() && !form.offices.includes(officeInput.trim())
      ? [...form.offices, officeInput.trim()]
      : form.offices
    const payload = { ...form, offices: finalOffices }
    setSaving(true)
    try {
      if (editTarget) {
        await updateSavedCompany(editTarget.id, payload)
        setCompanies((prev) => prev.map((c) => c.id === editTarget.id ? { ...c, ...payload } : c))
        toast('Company updated')
      } else {
        const id = await saveCompany(user.uid, payload)
        setCompanies((prev) => [...prev, { id, userId: user.uid, ...payload, savedAt: new Date() }])
        toast(`${form.companyName} saved`)
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(co: SavedCompany) {
    await removeSavedCompany(co.id)
    setCompanies((prev) => prev.filter((c) => c.id !== co.id))
    toast(`${co.companyName} removed`)
  }

  async function toggleApplied(co: SavedCompany) {
    const hasApplied = !co.hasApplied
    await updateSavedCompany(co.id, { hasApplied })
    setCompanies((prev) => prev.map((c) => c.id === co.id ? { ...c, hasApplied } : c))
  }

  const filtered = companies.filter((co) => {
    if (filterApplied === 'applied' && !co.hasApplied) return false
    if (filterApplied === 'not-applied' && co.hasApplied) return false
    if (filterPriority !== 'all' && co.priority !== filterPriority) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Watchlist</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track companies and their office locations.</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Company
        </button>
      </div>

      {/* Filters */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {(['all', 'not-applied', 'applied'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterApplied(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filterApplied === v
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {v === 'all' ? 'All' : v === 'applied' ? 'Applied' : 'Not applied'}
            </button>
          ))}
          <span className="text-slate-200 self-center">|</span>
          {(['all', 'High', 'Medium', 'Low'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterPriority(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                filterPriority === v
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {v === 'all' ? 'All priorities' : v}
            </button>
          ))}
        </div>
      )}

      {companies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title="No companies saved"
          description="Add companies and track their office locations and your application status."
          action={
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16} /> Add Company
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-slate-400 text-sm">No companies match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((co) => {
            const seed = SEED_COMPANIES.find((s) => s.id === co.companyId)
            return (
              <div key={co.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-slate-900">{co.companyName}</h2>
                      <span className={`badge text-xs ${PRIORITY_STYLES[co.priority]}`}>
                        {co.priority}
                      </span>
                      {co.hasApplied && (
                        <span className="badge bg-emerald-50 text-emerald-700 text-xs gap-1">
                          <CheckCircle2 size={11} /> Applied
                        </span>
                      )}
                    </div>

                    {/* Industry */}
                    {co.industry && (
                      <p className="text-sm text-slate-500 mt-0.5">{co.industry}</p>
                    )}

                    {/* Office location chips */}
                    {co.offices.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {co.offices.map((office) => (
                          <span
                            key={office}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium"
                          >
                            <MapPin size={10} />
                            {office}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {co.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-xl px-3 py-2">
                        {co.notes}
                      </p>
                    )}

                    {/* Seed data */}
                    {seed && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <p className="text-xs text-slate-500">{seed.whyGoodForNewGrads}</p>
                        <p className="text-xs text-slate-500">
                          Salary: {formatCurrency(seed.salaryRangeMin)} – {formatCurrency(seed.salaryRangeMax)}
                        </p>
                        <ScoreBar score={seed.newGradScore} label="New Grad Score" colorClass="bg-indigo-500" />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {seed.entryLevelRoles.map((r) => (
                            <span key={r} className="badge bg-slate-100 text-slate-600 text-xs">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {co.careerPageUrl && (
                      <a href={co.careerPageUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label="Careers page">
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      onClick={() => toggleApplied(co)}
                      className={`btn-icon ${co.hasApplied ? 'text-emerald-500' : 'text-slate-400'}`}
                      title={co.hasApplied ? 'Applied' : 'Mark applied'}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === co.id ? null : co.id)}
                      className="btn-icon"
                      title="Interview rounds"
                    >
                      <ClipboardList size={15} />
                    </button>
                    <button onClick={() => openEdit(co)} className="btn-icon" aria-label="Edit">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(co)} className="btn-icon text-slate-400 hover:text-red-500" aria-label="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Interview rounds panel */}
                {expandedId === co.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Interview Rounds</h3>
                      <button
                        onClick={() => { setAddingRoundFor(co.id); setRoundForm(BLANK_ROUND) }}
                        className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
                      >
                        + Add round
                      </button>
                    </div>

                    {co.interviewRounds.length === 0 && addingRoundFor !== co.id && (
                      <p className="text-xs text-slate-400 italic">No rounds tracked yet.</p>
                    )}

                    <div className="space-y-2">
                      {co.interviewRounds.map((round) => (
                        <div key={round.id} className="bg-slate-50 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800">{round.stage}</p>
                              {round.date && <p className="text-xs text-slate-500">{new Date(round.date).toLocaleDateString()}</p>}
                              {round.notes && <p className="text-xs text-slate-600 mt-1">{round.notes}</p>}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <select
                                className="text-xs border border-slate-200 rounded-lg px-1.5 py-0.5 bg-white"
                                value={round.outcome}
                                onChange={(e) => handleUpdateRoundOutcome(co, round.id, e.target.value as InterviewRound['outcome'])}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Passed">Passed</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button onClick={() => handleDeleteRound(co, round.id)} className="text-slate-400 hover:text-red-500">
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {addingRoundFor === co.id && (
                      <div className="mt-3 space-y-2 bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="input text-sm"
                            placeholder="Stage (e.g. Technical Round 1)"
                            value={roundForm.stage}
                            onChange={(e) => setRoundForm({ ...roundForm, stage: e.target.value })}
                            autoFocus
                          />
                          <input
                            type="date"
                            className="input text-sm"
                            value={roundForm.date}
                            onChange={(e) => setRoundForm({ ...roundForm, date: e.target.value })}
                          />
                        </div>
                        <textarea
                          className="textarea text-sm h-16"
                          placeholder="Notes (questions asked, feedback…)"
                          value={roundForm.notes}
                          onChange={(e) => setRoundForm({ ...roundForm, notes: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddRound(co)} className="btn-primary text-xs flex-1" disabled={!roundForm.stage}>Save</button>
                          <button onClick={() => setAddingRoundFor(null)} className="btn-secondary text-xs">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Company' : 'Add Company'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick-fill */}
          {!editTarget && (
            <div>
              <label className="label">Quick-fill from our database (optional)</label>
              <select
                className="select"
                onChange={(e) => fillFromSeed(e.target.value)}
                defaultValue=""
              >
                <option value="">Select a company…</option>
                {SEED_COMPANIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.city}, {c.state}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Company name */}
          <div>
            <label className="label" htmlFor="co-name">
              Company Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="co-name"
              className="input"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
              placeholder="e.g. Google"
            />
          </div>

          {/* Office locations */}
          <div>
            <label className="label">Office Locations</label>
            {/* Existing offices */}
            {form.offices.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.offices.map((office) => (
                  <span
                    key={office}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium"
                  >
                    <MapPin size={10} />
                    {office}
                    <button
                      type="button"
                      onClick={() => removeOffice(office)}
                      className="ml-0.5 rounded-md hover:bg-indigo-100 p-0.5"
                      aria-label={`Remove ${office}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Add new office */}
            <div className="flex gap-2">
              <input
                ref={officeInputRef}
                className="input flex-1"
                value={officeInput}
                onChange={(e) => setOfficeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOffice() } }}
                placeholder="e.g. Austin, TX · Tokyo, Japan · Remote"
              />
              <button
                type="button"
                onClick={addOffice}
                className="btn-secondary shrink-0"
                disabled={!officeInput.trim()}
              >
                Add
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Press Enter or click Add after each location.</p>
          </div>

          {/* Industry + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="co-industry">Industry</label>
              <input
                id="co-industry"
                className="input"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="e.g. Tech"
              />
            </div>
            <div>
              <label className="label" htmlFor="co-priority">Priority</label>
              <select
                id="co-priority"
                className="select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Applied checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="co-applied"
              type="checkbox"
              checked={form.hasApplied}
              onChange={(e) => setForm({ ...form, hasApplied: e.target.checked })}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <label htmlFor="co-applied" className="text-sm text-slate-700 cursor-pointer">
              Already applied
            </label>
          </div>

          {/* Career URL */}
          <div>
            <label className="label" htmlFor="co-url">Careers Page URL</label>
            <input
              id="co-url"
              type="url"
              className="input"
              value={form.careerPageUrl}
              onChange={(e) => setForm({ ...form, careerPageUrl: e.target.value })}
              placeholder="https://company.com/careers"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label" htmlFor="co-notes">Notes</label>
            <textarea
              id="co-notes"
              className="textarea h-24"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Why are you interested? Which roles? Contact info?"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <LoadingSpinner size="sm" /> : editTarget ? 'Save Changes' : 'Add Company'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
