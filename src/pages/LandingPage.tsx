import { useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, Building2, BarChart3, Target, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useState } from 'react'

const FEATURES = [
  {
    icon: MapPin,
    title: 'Research Cities',
    description: 'Compare cost of living, rent, and salary expectations across major metros.',
  },
  {
    icon: Building2,
    title: 'Discover Companies',
    description: 'Find new-grad-friendly companies ranked by culture, salary, and career growth.',
  },
  {
    icon: BarChart3,
    title: 'Compare Side by Side',
    description: 'Compare cities on salary, rent, and job market strength all at once.',
  },
  {
    icon: Briefcase,
    title: 'Track Applications',
    description: 'Keep every application, deadline, and recruiter contact organized in one place.',
  },
]

export function LandingPage() {
  const { signInWithGoogle, user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  async function handleSignIn() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch {
      setError('Sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-dvh px-4 text-center pt-16 pb-20">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-6">
          <Target size={28} className="text-indigo-300" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Land your first job
          <br />
          <span className="text-indigo-400">with confidence</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-md mb-8">
          Research cities, compare cost of living, track applications, and discover the best companies for new grads — all in one place.
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="flex items-center gap-3 bg-white text-slate-900 hover:bg-slate-50 active:scale-[0.98] font-semibold px-6 py-3.5 rounded-2xl transition-all duration-150 disabled:opacity-60 shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <img
              src="https://www.google.com/favicon.ico"
              alt=""
              className="w-4 h-4"
              aria-hidden="true"
            />
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
          {!loading && <ArrowRight size={16} className="text-slate-400" />}
        </button>

        <p className="text-slate-600 text-xs mt-4">Free to use. No credit card required.</p>
      </section>

      {/* Features */}
      <section className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
                <Icon size={20} className="text-indigo-300" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
