'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useSession } from '@/components/providers/AppProviders'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { ApiError, api } from '@/lib/client/api'
import { safeNext } from '@/lib/client/redirect'
import type { User } from '@/lib/types'
import { fieldErrors, loginSchema, registerSchema } from '@/lib/validation'

function PasswordInput({ a11y, value, onChange, autoComplete }: { a11y: object; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input {...a11y} type={show ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className="field pr-12" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-mute hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const params = useSearchParams()
  const { setUser } = useSession()
  const next = safeNext(params.get('next'))
  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof values) => (v: string) => {
    setValues((s) => ({ ...s, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const parsed = mode === 'login' ? loginSchema.safeParse(values) : registerSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setLoading(true)
    try {
      const { user } = await api<{ user: User }>(`/api/auth/${mode}`, { body: parsed.data })
      setUser(user)
      window.location.replace(next)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields)
        setFormError(err.message)
      } else setFormError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const otherHref = `${mode === 'login' ? '/register' : '/login'}${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`

  return (
    <div className="card p-6 sm:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mt-2 text-sm text-mute">
        {mode === 'login' ? 'Log in to check out, track orders and save your details.' : 'An account lets you check out, track your orders and save your delivery details.'}
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <FormError message={formError} />
        {mode === 'register' && (
          <Field id="name" label="Full name" error={errors.name}>
            {(a) => <input {...a} type="text" autoComplete="name" value={values.name} onChange={(e) => set('name')(e.target.value)} className="field" />}
          </Field>
        )}
        <Field id="email" label="Email" error={errors.email}>
          {(a) => <input {...a} type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => set('email')(e.target.value)} className="field" />}
        </Field>
        {mode === 'register' && (
          <Field id="phone" label="WhatsApp number" hint="We use this to confirm your orders." error={errors.phone}>
            {(a) => <input {...a} type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 024 123 4567" value={values.phone} onChange={(e) => set('phone')(e.target.value)} className="field" />}
          </Field>
        )}
        <Field id="password" label="Password" hint={mode === 'register' ? 'At least 8 characters, with a letter and a number.' : undefined} error={errors.password}>
          {(a) => <PasswordInput a11y={a} value={values.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}
        </Field>
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {mode === 'login' ? 'Log in' : 'Create account'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-mute">
        {mode === 'login' ? 'New here? ' : 'Already have an account? '}
        <Link href={otherHref} className="font-medium text-ink underline underline-offset-4">
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </Link>
      </p>
    </div>
  )
}
