export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size]
  return (
    <div
      className={`${sizeClass} rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
