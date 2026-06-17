import { useEffect, useState } from 'react'
import { Briefcase, Plus, Trash2, Edit2, ExternalLink, Search, Filter, LayoutList, Columns } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
  getJobApplications, addJobApplication, updateJobApplication, deleteJobApplication,
} from '../services/firestore'
import type { JobApplication, ApplicationStatus } from '../types'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useToast } from '../components/ui/Toast'

const STATUSES: ApplicationStatus[] = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected']

const COLUMN_STYLES: Record<ApplicationStatus, { header: string; card: string; dot: string }> = {
  Interested:   { header: 'bg-slate-50 border-slate-200',  card: 'border-slate-200',  dot: 'bg-slate-400' },
  Applied:      { header: 'bg-blue-50 border-blue-200',    card: 'border-blue-200',   dot: 'bg-blue-400' },
  Interviewing: { header: 'bg-amber-50 border-amber-200',  card: 'border-amber-200',  dot: 'bg-amber-400' },
  Offer:        { header: 'bg-emerald-50 border-emerald-200', card: 'border-emerald-200', dot: 'bg-emerald-400' },
  Rejected:     { header: 'bg-red-50 border-red-200',      card: 'border-red-100',    dot: 'bg-red-300' },
}

const BLANK_FORM: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  jobTitle: '', company: '', city: '', applicationUrl: '',
  status: 'Interested', dateApplied: '', deadline: '',
  notes: '', contactName: '', followUpDate: '',
}

export function JobsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'board'>('list')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<JobApplication | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'All'>('All')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null)

  useEffect(() => {
    if (!user) return
    getJobApplications(user.uid).then((data) => { setJobs(data); setLoading(false) })
  }, [user])

  function openAdd() { setEditTarget(null); setForm(BLANK_FORM); setModalOpen(true) }
  function openEdit(job: JobApplication) {
    setEditTarget(job)
    const { id: _id, userId: _uid, createdAt: _c, updatedAt: _u, ...rest } = job
    setForm(rest)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.jobTitle || !form.company) return
    setSaving(true)
    try {
      if (editTarget) {
        await updateJobApplication(editTarget.id, form)
        setJobs((prev) => prev.map((j) => j.id === editTarget.id ? { ...j, ...form, updatedAt: new Date() } : j))
        toast('Application updated')
      } else {
        const id = await addJobApplication(user.uid, form)
        setJobs((prev) => [...prev, { id, userId: user.uid, ...form, createdAt: new Date(), updatedAt: new Date() }])
        toast('Application added')
      }
      setModalOpen(false)
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteJobApplication(deleteTarget.id)
    setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id))
    toast(`${deleteTarget.jobTitle} deleted`)
    setDeleteTarget(null)
  }

  async function moveToStatus(jobId: string, status: ApplicationStatus) {
    await updateJobApplication(jobId, { status })
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status } : j))
  }

  const filtered = jobs.filter((j) => {
    const matchSearch = search === '' ||
      j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || j.status === filterStatus
    return matchSearch && matchStatus
  })
  const sorted = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  if (loading) return (
    <div className="flex items-center justify-center min-h-64 p-8"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className={`p-4 sm:p-6 lg:p-8 ${view === 'board' ? 'max-w-full' : 'max-w-4xl'} mx-auto pb-24 lg:pb-8`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">{jobs.length} application{jobs.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              title="List view"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setView('board')}
              className={`p-2 ${view === 'board' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              title="Kanban board"
            >
              <Columns size={16} />
            </button>
          </div>
          <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add</button>
        </div>
      </div>

      {/* Search + filter (list view only) */}
      {view === 'list' && jobs.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or company…" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select className="select pl-9 w-full sm:w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | 'All')}>
              <option value="All">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={26} />}
          title="No applications yet"
          description="Start tracking your job applications, deadlines, and recruiter contacts."
          action={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add your first application</button>}
        />
      ) : view === 'list' ? (
        /* ── List view ─────────────────────────────── */
        sorted.length === 0 ? (
          <div className="text-center py-12"><p className="text-slate-400 text-sm">No results match your search.</p></div>
        ) : (
          <div className="space-y-3">
            {sorted.map((job) => <JobCard key={job.id} job={job} onEdit={openEdit} onDelete={setDeleteTarget} />)}
          </div>
        )
      ) : (
        /* ── Kanban board ───────────────────────────── */
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {STATUSES.map((status) => {
            const col = jobs.filter((j) => j.status === status)
                          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            const styles = COLUMN_STYLES[status]
            const isOver = dragOver === status

            return (
              <div
                key={status}
                className={`flex flex-col rounded-2xl border ${styles.header} min-w-[220px] w-56 shrink-0 transition-all ${isOver ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(status) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  const id = e.dataTransfer.getData('jobId')
                  if (id) moveToStatus(id, status)
                  setDragId(null)
                  setDragOver(null)
                }}
              >
                {/* Column header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                    <span className="text-xs font-semibold text-slate-700">{status}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{col.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {col.map((job) => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('jobId', job.id); setDragId(job.id) }}
                      onDragEnd={() => { setDragId(null); setDragOver(null) }}
                      className={`bg-white rounded-xl border ${styles.card} p-3 cursor-grab active:cursor-grabbing select-none transition-opacity ${dragId === job.id ? 'opacity-40' : ''}`}
                    >
                      <p className="text-xs font-semibold text-slate-900 leading-snug">{job.jobTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{job.company}</p>
                      {job.city && <p className="text-xs text-slate-400 truncate">{job.city}</p>}
                      {job.deadline && (
                        <p className="text-xs text-amber-600 mt-1">Due {new Date(job.deadline).toLocaleDateString()}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => openEdit(job)} className="text-slate-400 hover:text-slate-700 p-0.5"><Edit2 size={12} /></button>
                        <button onClick={() => setDeleteTarget(job)} className="text-slate-400 hover:text-red-500 p-0.5"><Trash2 size={12} /></button>
                        {job.applicationUrl && (
                          <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-700 p-0.5"><ExternalLink size={12} /></a>
                        )}
                      </div>
                    </div>
                  ))}

                  {col.length === 0 && (
                    <div className={`rounded-xl border-2 border-dashed ${isOver ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'} h-16 flex items-center justify-center`}>
                      <span className="text-xs text-slate-400">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Application' : 'Add Application'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="job-title">Job Title *</label>
              <input id="job-title" className="input" required value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="label" htmlFor="job-company">Company *</label>
              <input id="job-company" className="input" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Google" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="job-city">City</label>
              <input id="job-city" className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Austin, TX" />
            </div>
            <div>
              <label className="label" htmlFor="job-status">Status</label>
              <select id="job-status" className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="job-url">Application URL</label>
            <input id="job-url" type="url" className="input" value={form.applicationUrl} onChange={(e) => setForm({ ...form, applicationUrl: e.target.value })} placeholder="https://company.com/apply" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label" htmlFor="job-applied">Date Applied</label>
              <input id="job-applied" type="date" className="input" value={form.dateApplied} onChange={(e) => setForm({ ...form, dateApplied: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="job-deadline">Deadline</label>
              <input id="job-deadline" type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="job-followup">Follow-up Date</label>
              <input id="job-followup" type="date" className="input" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="job-contact">Recruiter / Contact</label>
            <input id="job-contact" className="input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Jane Smith" />
          </div>
          <div>
            <label className="label" htmlFor="job-notes">Notes</label>
            <textarea id="job-notes" className="textarea h-24" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Interview feedback, requirements, next steps…" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <LoadingSpinner size="sm" /> : editTarget ? 'Save Changes' : 'Add Application'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Application" size="sm">
        <p className="text-sm text-slate-600 mb-5">
          Delete <strong>{deleteTarget?.jobTitle}</strong> at <strong>{deleteTarget?.company}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}

function JobCard({ job, onEdit, onDelete }: { job: JobApplication; onEdit: (j: JobApplication) => void; onDelete: (j: JobApplication) => void }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-slate-900 truncate">{job.jobTitle}</h2>
            <StatusBadge status={job.status} size="sm" />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{job.company}{job.city ? ` · ${job.city}` : ''}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
            {job.dateApplied && <span>Applied {new Date(job.dateApplied).toLocaleDateString()}</span>}
            {job.deadline && <span className="text-amber-600">Deadline {new Date(job.deadline).toLocaleDateString()}</span>}
            {job.followUpDate && <span>Follow up {new Date(job.followUpDate).toLocaleDateString()}</span>}
            {job.contactName && <span>Contact: {job.contactName}</span>}
          </div>
          {job.notes && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-xl px-3 py-2 line-clamp-2">{job.notes}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {job.applicationUrl && (
            <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" aria-label="Open link"><ExternalLink size={15} /></a>
          )}
          <button onClick={() => onEdit(job)} className="btn-icon" aria-label="Edit"><Edit2 size={15} /></button>
          <button onClick={() => onDelete(job)} className="btn-icon text-slate-400 hover:text-red-500" aria-label="Delete"><Trash2 size={15} /></button>
        </div>
      </div>
    </div>
  )
}
