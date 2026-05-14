import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Toggle from '../ui/Toggle'
import Button from '../ui/Button'

const EMPTY_FORM = {
  name:             '',
  broker_name:      '',
  login_number:     '',
  server_name:      '',
  account_type:     'demo',
  currency:         'USD',
  password:         '',
  max_lot:          0.1,
  max_daily_loss:   500,
  max_drawdown_pct: 10,
  allow_auto_trade: true,
  enabled:          true,
  notes:            '',
}

function validate(form, isEdit) {
  const errs = {}
  if (!form.name.trim())        errs.name        = 'Account name is required'
  if (!form.broker_name.trim()) errs.broker_name = 'Broker name is required'
  if (!form.login_number)       errs.login_number = 'MT5 login number is required'
  if (!form.server_name.trim()) errs.server_name  = 'Server name is required'
  if (!isEdit && !form.password) errs.password    = 'Password is required'
  if (form.max_lot <= 0)        errs.max_lot      = 'Must be greater than 0'
  if (form.max_daily_loss < 0)  errs.max_daily_loss = 'Cannot be negative'
  if (form.max_drawdown_pct <= 0 || form.max_drawdown_pct > 100)
    errs.max_drawdown_pct = 'Must be 1–100'
  return errs
}

export default function AccountFormModal({ open, onClose, account, onSave }) {
  const isEdit = !!account
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [errs,    setErrs]    = useState({})
  const [loading, setLoading] = useState(false)
  const [apiErr,  setApiErr]  = useState('')
  const [showPw,  setShowPw]  = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (account) {
        setForm({
          name:             account.name             ?? '',
          broker_name:      account.broker_name      ?? '',
          login_number:     account.login_number     ?? '',
          server_name:      account.server_name      ?? '',
          account_type:     account.account_type     ?? 'demo',
          currency:         account.currency         ?? 'USD',
          password:         '',               // never pre-fill password
          max_lot:          account.max_lot          ?? 0.1,
          max_daily_loss:   account.max_daily_loss   ?? 500,
          max_drawdown_pct: account.max_drawdown_pct ?? 10,
          allow_auto_trade: account.allow_auto_trade ?? true,
          enabled:          account.enabled          ?? true,
          notes:            account.notes            ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrs({})
      setApiErr('')
      setShowPw(false)
    }
  }, [open, account])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrs(e => ({ ...e, [key]: undefined }))
  }

  const handleSubmit = async () => {
    const validation = validate(form, isEdit)
    if (Object.keys(validation).length > 0) {
      setErrs(validation)
      return
    }
    setLoading(true)
    setApiErr('')
    try {
      // Don't send empty password on edit
      const payload = { ...form }
      if (isEdit && !payload.password) delete payload.password
      await onSave(payload, account?.id)
      onClose()
    } catch (err) {
      setApiErr(err?.response?.data?.detail || 'Failed to save account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${account?.name}` : 'Add MT5 Account'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary"   onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : 'Add Account'}
          </Button>
        </>
      }
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {apiErr && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {apiErr}
          </div>
        )}

        {/* Row 1: Name + Broker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Account Name"
            placeholder="My Exness Real"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            error={errs.name}
          />
          <Input
            label="Broker Name"
            placeholder="Exness"
            value={form.broker_name}
            onChange={e => set('broker_name', e.target.value)}
            error={errs.broker_name}
          />
        </div>

        {/* Row 2: Login + Server */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="MT5 Login Number"
            type="number"
            placeholder="12345678"
            value={form.login_number}
            onChange={e => set('login_number', e.target.value)}
            error={errs.login_number}
          />
          <Input
            label="MT5 Server Name"
            placeholder="Exness-MT5Real"
            value={form.server_name}
            onChange={e => set('server_name', e.target.value)}
            error={errs.server_name}
          />
        </div>

        {/* Row 3: Type + Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Account Type"
            value={form.account_type}
            onChange={e => set('account_type', e.target.value)}
            options={[
              { value: 'demo', label: 'Demo' },
              { value: 'real', label: 'Real' },
            ]}
          />
          <Select
            label="Account Currency"
            value={form.currency}
            onChange={e => set('currency', e.target.value)}
            options={['USD', 'EUR', 'GBP', 'JPY', 'AUD'].map(c => ({ value: c, label: c }))}
          />
        </div>

        {/* Password */}
        <div>
          {isEdit ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted uppercase tracking-wide">Password</label>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-surface">
                <CheckCircle size={14} className="text-success shrink-0" />
                <span className="text-sm text-muted">Password configured — leave blank to keep current</span>
              </div>
              <Input
                placeholder="New password (optional)"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="pointer-events-auto text-muted hover:text-text"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                error={errs.password}
              />
            </div>
          ) : (
            <Input
              label="Password"
              type={showPw ? 'text' : 'password'}
              placeholder="MT5 account password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="pointer-events-auto text-muted hover:text-text"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              error={errs.password}
            />
          )}
        </div>

        {/* Risk limits */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Risk Limits</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Max Lot per Trade"
              type="number"
              step="0.01"
              min="0.01"
              value={form.max_lot}
              onChange={e => set('max_lot', parseFloat(e.target.value))}
              error={errs.max_lot}
            />
            <Input
              label="Max Daily Loss $"
              type="number"
              step="1"
              min="0"
              value={form.max_daily_loss}
              onChange={e => set('max_daily_loss', parseFloat(e.target.value))}
              error={errs.max_daily_loss}
            />
            <Input
              label="Max Drawdown %"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={form.max_drawdown_pct}
              onChange={e => set('max_drawdown_pct', parseFloat(e.target.value))}
              error={errs.max_drawdown_pct}
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
            <div>
              <p className="text-sm font-medium text-text">Allow Auto Trading</p>
              <p className="text-xs text-muted mt-0.5">EA can open/close trades</p>
            </div>
            <Toggle
              checked={form.allow_auto_trade}
              onChange={v => set('allow_auto_trade', v)}
              label="Allow auto trading"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface">
            <div>
              <p className="text-sm font-medium text-text">Enable Account</p>
              <p className="text-xs text-muted mt-0.5">Account active in system</p>
            </div>
            <Toggle
              checked={form.enabled}
              onChange={v => set('enabled', v)}
              label="Enable account"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any notes about this account..."
            rows={3}
            className="w-full bg-bg border border-border rounded-lg text-sm text-text placeholder:text-muted
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                       px-3.5 py-2.5 resize-none transition-colors"
          />
        </div>
      </div>
    </Modal>
  )
}
