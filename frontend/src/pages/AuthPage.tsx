import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  TrendingDown,
  Truck,
  User as UserIcon,
} from 'lucide-react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ApiError } from '../services/api'
import { cn } from '../utils/cn'
import { formatUZS } from '../utils/format'
import { tr } from '../i18n/core'

const DEMO_EMAIL = 'dilshod@priceradar.uz'
const DEMO_PASSWORD = 'demo1234'

interface Errors {
  full_name?: string
  email?: string
  password?: string
  confirm?: string
  form?: string
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { login, register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  useEffect(() => {
    setErrors({})
  }, [mode])

  const validate = (): boolean => {
    const next: Errors = {}
    if (isRegister && fullName.trim().length < 2) next.full_name = tr('Please enter your full name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = tr('Enter a valid email address.')
    if (password.length < 8) next.password = tr('Password must be at least 8 characters.')
    if (isRegister && confirm !== password) next.confirm = tr('Passwords do not match.')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    setErrors({})
    try {
      if (isRegister) {
        const user = await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          business_name: businessName.trim() || undefined,
        })
        toast.success(tr('Welcome to PriceRadar, {name}!', { name: user.full_name.split(' ')[0] }))
      } else {
        const user = await login(email.trim(), password)
        toast.success(tr('Welcome back, {name}.', { name: user.full_name.split(' ')[0] }))
      }
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : tr('Unable to sign in. Please try again.')
      setErrors({ form: message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDemoLogin = async () => {
    if (demoLoading) return
    setDemoLoading(true)
    setErrors({})
    try {
      const user = await login(DEMO_EMAIL, DEMO_PASSWORD)
      toast.success(tr('Signed in as {name} (demo account).', { name: user.full_name }))
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : tr('Demo sign-in failed.')
      setErrors({ form: message })
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* Brand / value panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#0B2B20] px-6 py-8 text-white sm:px-10 lg:w-[46%] lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-400/10 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="8.25" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />
                <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
                <path d="M12 12 18.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="12" r="1.6" fill="white" />
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-tight">{tr("PriceRadar")}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">{tr("Market intelligence")}</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-md text-3xl font-semibold leading-[1.15] tracking-tight sm:text-[38px]">
            {tr("Know the market.")}
            <br />
            {tr("Buy smarter. Save more.")}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            {tr("Compare supplier offers by")} <span className="font-semibold text-white">{tr("total purchasing cost")}</span> {tr("— unit price, delivery and minimum order quantity — not just the cheapest headline price.")}
          </p>

          <ul className="mt-8 space-y-3.5 text-sm text-white/80">
            {[
              { icon: TrendingDown, text: tr('See true cost per order, delivery included') },
              { icon: ShieldCheck, text: tr('Verified suppliers clearly separated from demo data') },
              { icon: Truck, text: tr('Availability and minimum order checked before recommending') },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-3.5 w-3.5 text-brand-200" aria-hidden />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Killer flow preview */}
        <div className="relative mt-10 hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:block">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
              {tr("Example · 100 kg potatoes")}
            </p>
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
              {tr("Demo data")}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { name: 'Fergana Fresh Produce', price: 400_000, best: true },
              { name: 'Bukhara Farm Direct', price: 420_000, best: false },
              { name: 'Tashkent Agro Trade', price: 450_000, best: false },
            ].map((row) => (
              <div
                key={row.name}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-xs',
                  row.best ? 'bg-brand-500/90 text-white' : 'bg-white/5 text-white/75',
                )}
              >
                <span className="flex items-center gap-2">
                  {row.best && <Check className="h-3.5 w-3.5" aria-hidden />}
                  {row.name}
                </span>
                <span className="font-semibold">{formatUZS(row.price)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/50">
            {tr("Lowest total cost, not lowest unit price: the cheapest unit price still loses once delivery is added.")}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute right-4 top-4 sm:right-8">
          <LanguageSwitcher variant="full" />
        </div>
        <div className="w-full max-w-[420px]">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              {isRegister ? tr("Create your account") : tr("Sign in to PriceRadar")}
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              {isRegister
                ? tr("Start comparing real purchasing costs in a few minutes.")
                : tr("Use your business account, or explore with the demo account.")}
            </p>
          </div>

          <div className="card p-6">
            {errors.form && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-xs font-medium text-danger"
              >
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label htmlFor="full_name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                      {tr("Full name")}
                    </label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
                      <input
                        id="full_name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder={tr("Dilshod Karimov")}
                        autoComplete="name"
                        aria-invalid={Boolean(errors.full_name)}
                        className={cn('field pl-10', errors.full_name && 'border-danger/50')}
                      />
                    </div>
                    {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name}</p>}
                  </div>
                  <div>
                    <label htmlFor="business_name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                      {tr("Business name")} <span className="font-normal text-ink-muted">{tr("(optional)")}</span>
                    </label>
                    <input
                      id="business_name"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder={tr("Dilshod Grocery Market")}
                      autoComplete="organization"
                      className="field"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  {tr("Email address")}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={tr("you@business.uz")}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className={cn('field pl-10', errors.email && 'border-danger/50')}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  {tr("Password")}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isRegister ? tr("At least 8 characters") : tr("Your password")}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    aria-invalid={Boolean(errors.password)}
                    className={cn('field px-10', errors.password && 'border-danger/50')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted transition hover:bg-canvas hover:text-ink"
                    aria-label={showPassword ? tr("Hide password") : tr("Show password")}
                    title={showPassword ? tr("Hide password") : tr("Show password")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
              </div>

              {isRegister && (
                <div>
                  <label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                    {tr("Confirm password")}
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder={tr("Repeat your password")}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirm)}
                    className={cn('field', errors.confirm && 'border-danger/50')}
                  />
                  {errors.confirm && <p className="mt-1 text-xs text-danger">{errors.confirm}</p>}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {isRegister ? tr("Creating account…") : tr("Signing in…")}
                  </>
                ) : (
                  <>
                    {isRegister ? tr("Create account") : tr("Sign in")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{tr("or")}</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="btn-secondary w-full"
            >
              {demoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />
              )}
              {tr("Use the demo account")}
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-muted">
              {DEMO_EMAIL} · {DEMO_PASSWORD}
            </p>

            <p className="mt-5 text-center text-xs text-ink-muted">
              {isRegister ? tr("Already have an account?") : tr("New to PriceRadar?")}{' '}
              <Link
                to={isRegister ? '/login' : '/register'}
                className="font-semibold text-brand-700 underline-offset-2 hover:underline"
              >
                {isRegister ? tr("Sign in") : tr("Create an account")}
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-muted">
            {tr("PriceRadar is a demonstration MVP. Seeded prices, suppliers and trends are fictional.")}
          </p>
        </div>
      </div>
    </div>
  )
}
