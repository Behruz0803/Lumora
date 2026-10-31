import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError, tokenStore } from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** Set when the stored session could not be validated because the API was unreachable. */
  connectionError: string | null
  retryConnection: () => void
  login: (email: string, password: string) => Promise<User>
  register: (data: {
    full_name: string
    email: string
    password: string
    business_name?: string
  }) => Promise<User>
  logout: () => void
  refresh: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      if (!tokenStore.get()) {
        setUser(null)
        setConnectionError(null)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const me = await api.me()
        if (!active) return
        setUser(me)
        setConnectionError(null)
      } catch (error) {
        if (!active) return
        // Only an authentication failure should end the session. A network or
        // server outage must not silently sign the user out and destroy a valid token.
        if (error instanceof ApiError && error.status === 401) {
          tokenStore.clear()
          setUser(null)
          setConnectionError(null)
        } else {
          setConnectionError(
            error instanceof ApiError ? error.message : 'Could not reach the PriceRadar API.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void bootstrap()
    return () => {
      active = false
    }
  }, [retryCount])

  const retryConnection = useCallback(() => setRetryCount((count) => count + 1), [])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener('priceradar:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('priceradar:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password)
    tokenStore.set(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(
    async (payload: { full_name: string; email: string; password: string; business_name?: string }) => {
      const data = await api.register(payload)
      tokenStore.set(data.access_token)
      setUser(data.user)
      return data.user
    },
    [],
  )

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return
    const me = await api.me()
    setUser(me)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, connectionError, retryConnection, login, register, logout, refresh, setUser }),
    [user, loading, connectionError, retryConnection, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
