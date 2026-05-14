import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Plus, Trash2, CheckCircle, AlertCircle, User, Link2, Key, Sliders, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react'
import { authApi } from '../api/auth'
import { brokersApi } from '../api/brokers'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Toggle from '../components/ui/Toggle'
import Modal from '../components/ui/Modal'

const TABS = [
  { label: 'Profile', icon: User },
  { label: 'Brokers', icon: Link2 },
  { label: 'API Keys', icon: Key },
  { label: 'System',  icon: Sliders },
]

function ProfileTab() {
  const { user, setUser } = useAuthStore()
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')
    try {
      const updated = await authApi.updateProfile({ email })
      setUser(updated)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <Card header="Personal Information">
        <form onSubmit={handleSave} className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
              <CheckCircle size={14} />{success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              <AlertCircle size={14} />{error}
            </div>
          )}
          <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="p-3 bg-surface rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Plan</p>
              <p className="text-xs text-muted mt-0.5">Current subscription</p>
            </div>
            <Badge variant={user?.plan === 'pro' ? 'blue' : 'neutral'}>
              {user?.plan ?? 'free'}
            </Badge>
          </div>
          <Button type="submit" variant="primary" loading={saving} icon={<Save size={14} />}>
            Save Changes
          </Button>
        </form>
      </Card>

      <Card header="Change Password">
        <div className="space-y-4">
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
          <Input label="Confirm New Password" type="password" placeholder="••••••••" />
          <Button variant="primary" icon={<Save size={14} />}>Update Password</Button>
        </div>
      </Card>
    </div>
  )
}

function BrokersTab() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [deleting, setDeleting] = useState({})
  const [form, setForm] = useState({ login: '', password: '', server: '', broker_name: 'Exness', account_type: 'demo' })
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const data = await brokersApi.mt5Accounts()
      setAccounts(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAccounts() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setAddLoading(true)
    setError('')
    try {
      await brokersApi.addAccount(form)
      await fetchAccounts()
      setShowAdd(false)
      setForm({ login: '', password: '', server: '', broker_name: 'Exness', account_type: 'demo' })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to add account.')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(d => ({ ...d, [id]: true }))
    try {
      await brokersApi.deleteAccount(id)
      setAccounts(prev => prev.filter(a => a.id !== id))
    } catch {}
    finally { setDeleting(d => ({ ...d, [id]: false })) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">MT5 Accounts</h3>
          <p className="text-xs text-muted mt-0.5">Connect your broker accounts for live trading</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(true)}>
          Add Account
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-surface border border-border rounded-xl animate-skeleton" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-surface border border-border rounded-xl text-center gap-2">
          <Link2 size={24} className="text-border" />
          <p className="text-sm text-muted">No broker accounts connected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 bg-bg border border-border rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text">{a.broker_name ?? 'Unknown Broker'}</p>
                  <Badge variant={a.account_type === 'demo' ? 'warning' : 'success'}>
                    {a.account_type ?? 'live'}
                  </Badge>
                  <Badge variant="neutral">{a.currency ?? 'USD'}</Badge>
                </div>
                <p className="text-xs text-muted mt-0.5">Login: {a.login} · Server: {a.server ?? '—'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                loading={deleting[a.id]}
                icon={<Trash2 size={13} />}
                className="text-danger hover:bg-danger/10"
                onClick={() => handleDelete(a.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add MT5 Account" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button variant="primary" loading={addLoading} onClick={handleAdd}>Connect Account</Button>
        </>}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {error && (
            <div className="flex gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <Select label="Broker" value={form.broker_name} onChange={e => set('broker_name', e.target.value)}
            options={['Exness', 'Vantage', 'ICMarkets', 'Pepperstone', 'FXCM', 'XM'].map(v => ({ value: v, label: v }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Login / Account Number" value={form.login} onChange={e => set('login', e.target.value)} placeholder="12345678" required />
            <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required />
          </div>
          <Input label="Server" value={form.server} onChange={e => set('server', e.target.value)} placeholder="Exness-MT5Real" />
          <Select label="Account Type" value={form.account_type} onChange={e => set('account_type', e.target.value)}
            options={[{ value: 'demo', label: 'Demo' }, { value: 'real', label: 'Real / Live' }]} />
        </form>
      </Modal>
    </div>
  )
}

// ── Shared key-row component ─────────────────────────────────────────────────
function KeyRow({ label, description, value, loading, onReveal, revealed, onRegenerate, regenerating }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const maskedKey = value
    ? value.slice(0, 8) + '••••••••••••••••••••••••' + value.slice(-4)
    : '••••••••••••••••••••••••••••••••'

  return (
    <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
      <div>
        <p className="text-sm font-semibold text-text">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>

      {/* Key display */}
      <div className="flex items-center gap-2 p-3 bg-bg border border-border rounded-lg font-mono text-xs text-muted overflow-hidden">
        <span className="flex-1 truncate select-all">
          {revealed && value ? value : maskedKey}
        </span>
        {/* Copy button — only when revealed */}
        {revealed && value && (
          <button
            onClick={handleCopy}
            className="shrink-0 p-1 rounded text-muted hover:text-text transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          icon={revealed ? <EyeOff size={13} /> : <Eye size={13} />}
          onClick={onReveal}
          loading={loading}
        >
          {revealed ? 'Hide' : 'Reveal'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={13} />}
          loading={regenerating}
          onClick={onRegenerate}
          className="text-warning hover:bg-warning/10"
        >
          Regenerate
        </Button>
      </div>
    </div>
  )
}

function ApiKeysTab() {
  const { user, setUser } = useAuthStore()

  // User API key state
  const [userKeyRevealed,    setUserKeyRevealed]    = useState(false)
  const [userKeyLoading,     setUserKeyLoading]      = useState(false)
  const [userKeyRegenerating,setUserKeyRegenerating] = useState(false)
  const [userKey,            setUserKey]             = useState(user?.api_key || null)

  // MT5 EA keys state
  const [accounts,      setAccounts]      = useState([])
  const [acctLoading,   setAcctLoading]   = useState(true)
  const [revealed,      setRevealed]      = useState({})      // { [id]: bool }
  const [regenerating,  setRegenerating]  = useState({})      // { [id]: bool }

  useEffect(() => {
    brokersApi.mt5Accounts()
      .then(d => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setAcctLoading(false))
  }, [])

  // ── User API key handlers ────────────────────────────────────────────────
  const handleRevealUserKey = async () => {
    if (userKeyRevealed) { setUserKeyRevealed(false); return }
    // Key is already in user object from /auth/me — just show it
    setUserKeyLoading(true)
    try {
      const me = await authApi.me(useAuthStore.getState().token)
      setUserKey(me.api_key)
      setUser(me)
      setUserKeyRevealed(true)
    } catch {
      alert('Failed to load API key.')
    } finally {
      setUserKeyLoading(false)
    }
  }

  const handleRegenerateUserKey = async () => {
    if (!window.confirm('Regenerate your API key? The old key will stop working immediately.')) return
    setUserKeyRegenerating(true)
    try {
      const updated = await authApi.regenerateApiKey()
      setUserKey(updated.api_key)
      setUser(updated)
      setUserKeyRevealed(true)   // auto-reveal after regenerate
    } catch {
      alert('Failed to regenerate API key.')
    } finally {
      setUserKeyRegenerating(false)
    }
  }

  // ── EA key handlers (per MT5 account) ───────────────────────────────────
  const handleRevealEaKey = (id) => {
    setRevealed(r => ({ ...r, [id]: !r[id] }))
  }

  const handleRegenerateEaKey = async (id, name) => {
    if (!window.confirm(`Regenerate EA key for "${name}"? The EA will disconnect until you paste the new key.`)) return
    setRegenerating(r => ({ ...r, [id]: true }))
    try {
      const updated = await brokersApi.regenerateEaKey(id)
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
      setRevealed(r => ({ ...r, [id]: true }))   // auto-reveal new key
    } catch {
      alert('Failed to regenerate EA key.')
    } finally {
      setRegenerating(r => ({ ...r, [id]: false }))
    }
  }

  return (
    <div className="max-w-lg space-y-6">

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
        <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-warning">Keep your keys secure</p>
          <p className="text-xs text-muted mt-0.5">Never share API keys or EA keys. Regenerating creates a new key — the old one stops working immediately.</p>
        </div>
      </div>

      {/* User API key */}
      <div>
        <h3 className="text-sm font-semibold text-text mb-3">User API Key</h3>
        <KeyRow
          label="Secret API Key"
          description="Used for direct API access and integrations."
          value={userKey}
          revealed={userKeyRevealed}
          loading={userKeyLoading}
          onReveal={handleRevealUserKey}
          regenerating={userKeyRegenerating}
          onRegenerate={handleRegenerateUserKey}
        />
      </div>

      {/* EA keys per MT5 account */}
      <div>
        <h3 className="text-sm font-semibold text-text mb-1">MT5 EA Keys</h3>
        <p className="text-xs text-muted mb-3">Paste each key into the <span className="font-mono bg-surface px-1 rounded">MT5AccountKey</span> input of the SignalChecker EA for that account.</p>

        {acctLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-surface border border-border rounded-xl animate-skeleton" />)}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center bg-surface border border-border rounded-xl text-sm text-muted">
            No MT5 accounts found. Add one in the <strong>Brokers</strong> tab or <strong>MT5 Accounts</strong> page.
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => (
              <KeyRow
                key={acc.id}
                label={acc.name}
                description={`${acc.broker ?? ''}  ·  ${acc.mt5_login ?? acc.login ?? ''}  ·  ${acc.account_type === 'real' ? 'Real' : 'Demo'}`}
                value={acc.ea_api_key}
                revealed={!!revealed[acc.id]}
                loading={false}
                onReveal={() => handleRevealEaKey(acc.id)}
                regenerating={!!regenerating[acc.id]}
                onRegenerate={() => handleRegenerateEaKey(acc.id, acc.name)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function SystemTab() {
  const { isDark, toggle } = useThemeStore()
  const [notifications, setNotifications] = useState(true)
  const [signalAlerts, setSignalAlerts]   = useState(true)
  const [riskAlerts, setRiskAlerts]       = useState(true)

  return (
    <div className="max-w-lg space-y-4">
      <Card header="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Dark Mode</p>
            <p className="text-xs text-muted mt-0.5">Toggle between light and dark theme</p>
          </div>
          <Toggle checked={isDark} onChange={toggle} label="Dark mode" />
        </div>
      </Card>

      <Card header="Notifications">
        {[
          ['Enable Notifications', 'Receive alerts in the browser', notifications, setNotifications],
          ['Signal Alerts', 'Get notified for new trading signals', signalAlerts, setSignalAlerts],
          ['Risk Alerts', 'Alerts when drawdown thresholds are breached', riskAlerts, setRiskAlerts],
        ].map(([label, desc, val, set]) => (
          <div key={label} className="flex items-center justify-between py-3 first:pt-0 border-b border-border last:border-none">
            <div>
              <p className="text-sm font-medium text-text">{label}</p>
              <p className="text-xs text-muted mt-0.5">{desc}</p>
            </div>
            <Toggle checked={val} onChange={set} label={label} />
          </div>
        ))}
      </Card>

      <Card header="Danger Zone">
        <div className="space-y-3">
          <p className="text-xs text-muted">These actions are irreversible. Please proceed with caution.</p>
          <div className="flex gap-3">
            <Button variant="danger" size="sm">Delete All Data</Button>
            <Button variant="danger" size="sm">Delete Account</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState(0)

  const panels = [ProfileTab, BrokersTab, ApiKeysTab, SystemTab]
  const Panel = panels[tab]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account and platform preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <div className="w-full md:w-48 shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(({ label, icon: Icon }, i) => (
              <button
                key={label}
                onClick={() => setTab(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === i
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-surface hover:text-text'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <Panel />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
