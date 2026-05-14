import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { usersApi } from '../../api/users'

const ROLE_OPTIONS = [
  { value: 'admin',     label: 'Admin' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'user',      label: 'User' },
]

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'pending',  label: 'Pending' },
]

function emptyForm() {
  return {
    full_name: '',
    email: '',
    username: '',
    role_name: 'user',
    status: 'active',
    phone: '',
    password: '',
    confirm_password: '',
    note: '',
  }
}

function validate(fields, isEdit) {
  const errors = {}
  if (!fields.email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Enter a valid email address.'
  if (!fields.role_name) errors.role_name = 'Role is required.'
  if (!isEdit) {
    if (!fields.password) errors.password = 'Password is required.'
    else if (fields.password.length < 6) errors.password = 'Password must be at least 6 characters.'
  } else {
    if (fields.password && fields.password.length < 6)
      errors.password = 'Password must be at least 6 characters.'
  }
  if (fields.password && fields.password !== fields.confirm_password)
    errors.confirm_password = 'Passwords do not match.'
  return errors
}

export default function UserFormModal({ open, onClose, user, onSuccess }) {
  const isEdit = Boolean(user)
  const [fields, setFields] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens/user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setFields({
          full_name:        user.full_name ?? '',
          email:            user.email ?? '',
          username:         user.username ?? '',
          role_name:        user.role_name ?? 'user',
          status:           user.status ?? 'active',
          phone:            user.phone ?? '',
          password:         '',
          confirm_password: '',
          note:             user.note ?? '',
        })
      } else {
        setFields(emptyForm())
      }
      setErrors({})
      setApiError('')
    }
  }, [open, user])

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields, isEdit)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      const payload = {
        email:     fields.email.trim(),
        full_name: fields.full_name.trim() || undefined,
        username:  fields.username.trim()  || undefined,
        role_name: fields.role_name,
        status:    fields.status,
        phone:     fields.phone.trim()     || undefined,
        note:      fields.note.trim()      || undefined,
      }
      if (fields.password) payload.password = fields.password

      if (isEdit) {
        await usersApi.update(user.id, payload)
      } else {
        await usersApi.create(payload)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'An error occurred. Please try again.'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  const showConfirmPassword = Boolean(fields.password)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Add User'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {apiError && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger">
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={fields.full_name}
            onChange={set('full_name')}
            error={errors.full_name}
          />
          <Input
            label="Username"
            placeholder="janedoe"
            value={fields.username}
            onChange={set('username')}
            error={errors.username}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="jane@example.com"
          value={fields.email}
          onChange={set('email')}
          error={errors.email}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={fields.role_name}
            onChange={set('role_name')}
            error={errors.role_name}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={fields.status}
            onChange={set('status')}
            error={errors.status}
          />
        </div>

        <Input
          label="Phone"
          placeholder="+1 555 000 0000"
          value={fields.phone}
          onChange={set('phone')}
          error={errors.phone}
        />

        <Input
          label={isEdit ? 'New Password' : 'Password'}
          type="password"
          placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'}
          value={fields.password}
          onChange={set('password')}
          error={errors.password}
          hint={isEdit && !fields.password ? 'Leave blank to keep the current password.' : undefined}
        />

        {showConfirmPassword && (
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={fields.confirm_password}
            onChange={set('confirm_password')}
            error={errors.confirm_password}
          />
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">Note</label>
          <textarea
            rows={2}
            placeholder="Optional internal note..."
            value={fields.note}
            onChange={set('note')}
            className="w-full bg-bg border border-border rounded-lg text-sm text-text placeholder:text-muted
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                       px-3.5 py-2.5 resize-none transition-colors"
          />
        </div>
      </form>
    </Modal>
  )
}
