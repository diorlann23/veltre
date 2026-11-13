'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useSession } from '@/components/providers/AppProviders'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { Confirm } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toaster'
import { ApiError, api } from '@/lib/client/api'
import type { User } from '@/lib/types'
import { changePasswordSchema, fieldErrors, profileSchema } from '@/lib/validation'

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const { logout } = useSession()
  const tabs = [
    { href: '/account', label: 'Profile', active: pathname === '/account' },
    { href: '/account/orders', label: 'Orders', active: pathname.startsWith('/account/orders') },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', active: false }] : []),
  ]
  return (
    <nav aria-label="Account" className="flex items-center gap-1 rounded-full border border-line bg-white/50 p-1">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={t.active ? 'page' : undefined} className={`rounded-full px-4 py-2 text-sm font-medium transition ${t.active ? 'bg-ink text-paper' : 'text-mute hover:text-ink'}`}>
          {t.label}
        </Link>
      ))}
      <button type="button" onClick={() => logout()} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-mute hover:text-ink">
        <LogOut className="size-4" aria-hidden="true" /> <span className="max-sm:sr-only">Log out</span>
      </button>
    </nav>
  )
}

export function ProfileForm({ user }: { user: User }) {
  const { setUser } = useSession()
  const router = useRouter()
  const toast = useToast()
  const [values, setValues] = useState({ name: user.name, phone: user.phone, address: user.address })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const parsed = profileSchema.safeParse(values)
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setLoading(true)
    try {
      const res = await api<{ user: User }>('/api/account', { method: 'PATCH', body: parsed.data })
      setUser(res.user)
      router.refresh()
      toast({ title: 'Profile saved' })
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      setFormError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Profile &amp; delivery details</h2>
        <p className="mt-1 text-sm text-mute">{user.email}</p>
      </div>
      <FormError message={formError} />
      <Field id="profile-name" label="Full name" error={errors.name}>
        {(a) => <input {...a} autoComplete="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} className="field" />}
      </Field>
      <Field id="profile-phone" label="WhatsApp number" error={errors.phone}>
        {(a) => <input {...a} type="tel" autoComplete="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} className="field" />}
      </Field>
      <Field id="profile-address" label="Default delivery address" optional error={errors.address}>
        {(a) => <textarea {...a} rows={3} autoComplete="street-address" value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} className="field resize-y" />}
      </Field>
      <Button type="submit" loading={loading}>Save changes</Button>
    </form>
  )
}

export function PasswordForm() {
  const toast = useToast()
  const [values, setValues] = useState({ currentPassword: '', newPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const parsed = changePasswordSchema.safeParse(values)
    if (!parsed.success) return setErrors(fieldErrors(parsed.error))
    setErrors({})
    setLoading(true)
    try {
      await api('/api/account/password', { body: parsed.data })
      setValues({ currentPassword: '', newPassword: '' })
      toast({ title: 'Password changed', description: 'Other devices have been logged out.' })
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      setFormError(err instanceof Error ? err.message : 'Could not change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8">
      <h2 className="font-display text-xl font-semibold tracking-tight">Change password</h2>
      <FormError message={formError} />
      <Field id="current-password" label="Current password" error={errors.currentPassword}>
        {(a) => <input {...a} type="password" autoComplete="current-password" value={values.currentPassword} onChange={(e) => setValues({ ...values, currentPassword: e.target.value })} className="field" />}
      </Field>
      <Field id="new-password" label="New password" hint="At least 8 characters, with a letter and a number." error={errors.newPassword}>
        {(a) => <input {...a} type="password" autoComplete="new-password" value={values.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} className="field" />}
      </Field>
      <Button type="submit" variant="secondary" loading={loading}>Update password</Button>
    </form>
  )
}

export function CancelOrderButton({ number, className = 'text-accent' }: { number: string; className?: string }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const onConfirm = async () => {
    setLoading(true)
    try {
      await api(`/api/account/orders/${number}/cancel`, { method: 'POST' })
      toast({ title: 'Order cancelled' })
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast({ variant: 'error', title: 'Could not cancel', description: err instanceof Error ? err.message : undefined })
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className={className}>Cancel order</Button>
      <Confirm open={open} onOpenChange={setOpen} title="Cancel this order?" description="The items will be released back to stock. You can’t undo this." confirmLabel="Cancel order" onConfirm={onConfirm} loading={loading} danger />
    </>
  )
}
