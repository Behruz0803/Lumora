import { useSyncExternalStore, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { getLanguage, subscribe } from './i18n'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layouts/AppLayout'
import { AuthPage } from './pages/AuthPage'
import { OverviewPage } from './pages/OverviewPage'
import { ComparePage } from './pages/ComparePage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { SupplierDetailPage } from './pages/SupplierDetailPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AssistantPage } from './pages/AssistantPage'
import { SavedOffersPage } from './pages/SavedOffersPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { FullPageLoader } from './components/FullPageLoader'
import { ConnectionErrorScreen } from './components/ConnectionErrorScreen'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, connectionError } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  // A valid session exists but the API is unreachable: do not sign the user out.
  if (!user && connectionError) return <ConnectionErrorScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading, connectionError } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user && connectionError) return <ConnectionErrorScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppShell() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="login" />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="register" />
                </PublicOnlyRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="compare" element={<ComparePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:productId" element={<ProductDetailPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="suppliers/:supplierId" element={<SupplierDetailPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="saved-offers" element={<SavedOffersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

/**
 * The interface language lives in a small external store. Re-mounting the shell
 * on change guarantees every screen (and every plain `tr()` call) re-renders in
 * the new language without threading a hook through the whole component tree.
 */
export default function App() {
  const language = useSyncExternalStore(subscribe, getLanguage, getLanguage)
  return <AppShell key={language} />
}
