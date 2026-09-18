import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
export function ProtectedRoute(): JSX.Element { return useAuthStore((state) => state.isAuthenticated) ? <Outlet /> : <Navigate to="/login" replace /> }
