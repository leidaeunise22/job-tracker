import type { ApplicationStatus } from '../../types'

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Interested: 'bg-slate-100 text-slate-600',
  Applied: 'bg-blue-50 text-blue-700',
  Interviewing: 'bg-amber-50 text-amber-700',
  Offer: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-600',
}

interface Props {
  status: ApplicationStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`badge font-medium ${sizeClass} ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}
