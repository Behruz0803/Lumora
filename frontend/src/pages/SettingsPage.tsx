import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  Check,
  Globe2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { formatDate } from '../utils/format'
import { cn } from '../utils/cn'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'uz', label: "O'zbekcha" },
]

function Section({
  title,
  description,
  icon,
  children,
  footer,
}: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            {icon}
          </span>
          {title}
        </h2>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="flex items-center justify-between gap-2 border-t border-line bg-canvas/50 px-5 py-3">
          {footer}
        </div>
      )}
    </section>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand-500' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}

export function SettingsPage() {
  const { user, setUser, logout, refresh } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState('en')
  const [notifyPriceDrops, setNotifyPriceDrops] = useState(true)
  const [notifyNewOffers, setNotifyNewOffers] = useState(false)
  const [notifyDigest, setNotifyDigest] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    setFullName(user.full_name)
    setBusinessName(user.business_name ?? '')
    setPhone(user.phone ?? '')
    setLanguage(user.language)
    setNotifyPriceDrops(user.notify_price_drops)
    setNotifyNewOffers(user.notify_new_offers)
    setNotifyDigest(user.notify_weekly_digest)
  }, [user])

  if (!user) return null

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (fullName.trim().length < 2) {
      toast.error('Please enter your full name.')
      return
    }
    setSavingProfile(true)
    try {
      const updated = await api.updateProfile({
        full_name: fullName.trim(),
        business_name: businessName.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      setUser(updated)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update your profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePreferences = async () => {
    setSavingPreferences(true)
    try {
      const updated = await api.updateProfile({
        language,
        notify_price_drops: notifyPriceDrops,
        notify_new_offers: notifyNewOffers,
        notify_weekly_digest: notifyDigest,
      })
      setUser(updated)
      toast.success('Preferences saved.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save preferences.')
    } finally {
      setSavingPreferences(false)
    }
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    setChangingPassword(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      toast.success('Password changed. Use it next time you sign in.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await refresh()
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Could not change your password.')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, business details, language, notifications and security."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Section
          title="Profile information"
          description="How your name appears across PriceRadar."
          icon={<UserIcon className="h-3.5 w-3.5" />}
          footer={
            <>
              <p className="text-[11px] text-ink-muted">Member since {formatDate(user.created_at)}</p>
              <button type="submit" form="profile-form" disabled={savingProfile} className="btn-primary">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save profile
              </button>
            </>
          }
        >
          <form id="profile-form" onSubmit={saveProfile} className="space-y-4">
            <div>
              <label htmlFor="settings-name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Full name
              </label>
              <input
                id="settings-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="field"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="settings-email" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
                <input
                  id="settings-email"
                  value={user.email}
                  readOnly
                  disabled
                  className="field pl-10"
                />
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">
                Email changes are disabled in this demo. Contact support to change it.
              </p>
            </div>
          </form>
        </Section>

        <Section
          title="Business information"
          description="Used on purchase summaries when you contact a supplier."
          icon={<Building2 className="h-3.5 w-3.5" />}
          footer={
            <>
              <Badge tone={user.business_name ? 'green' : 'neutral'}>
                {user.business_name ? 'Business linked' : 'No business set'}
              </Badge>
              <button type="submit" form="business-form" disabled={savingProfile} className="btn-primary">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save business
              </button>
            </>
          }
        >
          <form id="business-form" onSubmit={saveProfile} className="space-y-4">
            <div>
              <label htmlFor="settings-business" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Business name
              </label>
              <input
                id="settings-business"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Dilshod Grocery Market"
                className="field"
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="settings-phone" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Phone number
              </label>
              <input
                id="settings-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+998 90 123 45 67"
                className="field"
                autoComplete="tel"
              />
            </div>
          </form>
        </Section>

        <Section
          title="Language & notifications"
          description="Choose your interface language and what we notify you about."
          icon={<Globe2 className="h-3.5 w-3.5" />}
          footer={
            <>
              <p className="text-[11px] text-ink-muted">
                Interface translations are limited to labels in this MVP.
              </p>
              <button
                type="button"
                onClick={() => void savePreferences()}
                disabled={savingPreferences}
                className="btn-primary"
              >
                {savingPreferences ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save preferences
              </button>
            </>
          }
        >
          <div>
            <label htmlFor="settings-language" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              Language
            </label>
            <select
              id="settings-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="field"
            >
              {LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 divide-y divide-line">
            <Toggle
              checked={notifyPriceDrops}
              onChange={setNotifyPriceDrops}
              label="Price drop alerts"
              description="Notify me when a saved offer becomes cheaper."
            />
            <Toggle
              checked={notifyNewOffers}
              onChange={setNotifyNewOffers}
              label="New supplier offers"
              description="Notify me when a new supplier lists a tracked product."
            />
            <Toggle
              checked={notifyDigest}
              onChange={setNotifyDigest}
              label="Weekly market digest"
              description="A weekly summary of price movement for my categories."
            />
          </div>
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-canvas px-2.5 py-2 text-[11px] text-ink-muted">
            <Bell className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            Notification delivery is not connected in this MVP — preferences are stored on your account.
          </p>
        </Section>

        <Section
          title="Account security"
          description="Change the password used to sign in."
          icon={<KeyRound className="h-3.5 w-3.5" />}
          footer={
            <>
              <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <ShieldCheck className="h-3 w-3 text-brand-600" aria-hidden />
                Passwords are hashed with bcrypt.
              </p>
              <button
                type="submit"
                form="password-form"
                disabled={changingPassword}
                className="btn-primary"
              >
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update password
              </button>
            </>
          }
        >
          <form id="password-form" onSubmit={changePassword} className="space-y-3">
            {passwordError && (
              <p role="alert" className="rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-xs text-danger">
                {passwordError}
              </p>
            )}
            <div>
              <label htmlFor="current-password" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="field"
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="field"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="field"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </form>
        </Section>
      </div>

      <section className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Session</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Signed in as {user.email}. Tokens expire after 7 days.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="btn-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}
