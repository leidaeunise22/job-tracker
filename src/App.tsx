import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { CitiesPage } from './pages/CitiesPage'
import { CompaniesPage } from './pages/CompaniesPage'
import { JobsPage } from './pages/JobsPage'
import { ComparePage } from './pages/ComparePage'
import { CityFinderPage } from './pages/CityFinderPage'
import { OffersPage } from './pages/OffersPage'
import { CompanyFinderPage } from './pages/CompanyFinderPage'
import { ToastProvider } from './components/ui/Toast'
import { PageLoader } from './components/ui/LoadingSpinner'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cities" element={<CitiesPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/city-finder" element={<CityFinderPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/company-finder" element={<CompanyFinderPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}
