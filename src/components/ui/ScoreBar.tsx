interface Props {
  score: number
  max?: number
  label?: string
  colorClass?: string
}

export function ScoreBar({ score, max = 10, label, colorClass = 'bg-indigo-500' }: Props) {
  const pct = Math.round((score / max) * 100)
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">{label}</span>
          <span className="text-xs font-semibold text-slate-700">{score}/{max}</span>
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
