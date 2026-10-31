import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bot,
  Bookmark,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Scale,
  Settings,
  Store,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GlobalSearch } from '../components/GlobalSearch'
import { DemoBadge } from '../components/ui/Badge'
import { cn } from '../utils/cn'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/compare', label: 'Price Comparison', icon: Scale },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/suppliers', label: 'Suppliers', icon: Store },
  { to: '/analytics', label: 'Market Analytics', icon: BarChart3 },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/saved-offers', label: 'Saved Offers', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="PriceRadar home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8.25" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
          <path d="M12 12 18.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.6" fill="white" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-ink">PriceRadar</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Market intelligence
        </span>
      </span>
    </Link>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-soft hover:bg-canvas hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('h-4.5 w-4.5', isActive ? 'text-brand-600' : 'text-ink-muted')}
                    aria-hidden
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="rounded-xl bg-canvas px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink">Illustrative dataset</p>
            <DemoBadge />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            All prices are fictional demo values for product demonstration.
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {user?.full_name
              ?.split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() ?? 'PR'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{user?.full_name ?? 'Guest'}</p>
            <p className="truncate text-[11px] text-ink-muted">{user?.business_name ?? 'No business set'}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-white hover:text-danger"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="relative h-full w-[280px] animate-slide-in border-r border-line bg-white shadow-modal">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-muted hover:bg-canvas"
              aria-label="Close navigation"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-ink-soft transition hover:bg-canvas lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="lg:hidden">
              <Brand />
            </div>

            <div className="hidden flex-1 lg:block">
              <GlobalSearch />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:block">
                <DemoBadge />
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-2 py-1.5 text-sm transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                    {user?.full_name
                      ?.split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() ?? 'PR'}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs font-semibold text-ink sm:block">
                    {user?.full_name?.split(' ')[0] ?? 'Account'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-raised"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink">{user?.full_name}</p>
                      <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => navigate('/settings')}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-soft transition hover:bg-canvas"
                    >
                      <Settings className="h-4 w-4 text-ink-muted" aria-hidden />
                      Account settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        logout()
                        navigate('/login')
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger transition hover:bg-danger/5"
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-line px-4 py-2 lg:hidden">
            <GlobalSearch />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
