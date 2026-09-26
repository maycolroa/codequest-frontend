import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import AssessmentPage from '@/pages/AssessmentPage'
import PathDetailPage from '@/pages/PathDetailPage'
import CourseLearningPage from '@/pages/CourseLearningPage'
import RoutesPage from '@/pages/RoutesPage'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const StarMap3D = lazy(() => import('@/components/galaxy/StarMap3D'))

function ProtectedRoutes(): JSX.Element {
  const { token, user, isAuthenticated, isLoading, fetchMe } = useAuthStore()
  useEffect(() => { if (token && !user && !isLoading) void fetchMe().catch(() => undefined) }, [fetchMe, isLoading, token, user])
  if (isLoading || (token && !user && !isAuthenticated)) return <p className="p-10 text-white">Validando sesión...</p>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function TokenRedirectHandler(): null {
  const location = useLocation()
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const fetchMe = useAuthStore((state) => state.fetchMe)
  useEffect(() => {
    if (location.pathname === '/auth/callback') return
    const token = new URLSearchParams(location.search).get('token')
    if (!token) return
    const cleanUrl = `${location.pathname}${location.hash}`
    window.history.replaceState({}, document.title, cleanUrl)
    setToken(token)
    void fetchMe().then(() => { const hasAssessment = Boolean(window.localStorage.getItem('codequest:assessment')); navigate(hasAssessment ? '/dashboard' : '/assessment', { replace: true }) }).catch(() => navigate('/login', { replace: true }))
  }, [fetchMe, location.hash, location.pathname, location.search, navigate, setToken])
  return null
}

export default function App(): JSX.Element {
  return <BrowserRouter><TokenRedirectHandler /><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/starmap" element={<Suspense fallback={<LoadingSpinner />}><StarMap3D /></Suspense>} />
    <Route element={<ProtectedRoutes />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/assessment" element={<AssessmentPage />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/paths/:id" element={<PathDetailPage />} />
      <Route path="/courses/:id" element={<CourseLearningPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>
}