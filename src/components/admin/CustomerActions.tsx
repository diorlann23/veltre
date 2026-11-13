'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropdownMenu } from 'radix-ui'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Confirm, Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toaster'
import { ApiError, api } from '@/lib/client/api'
import type { Role } from '@/lib/types'

const item = 'cursor-pointer rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-bone'

export function CustomerActions({ id, name, role, disabled }: { id: string; name: string; role: Role; disabled: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState<{ body: Record<string, unknown>; title: string; description: string; label: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [resetError, setResetError] = useState<string>()

  const resetPassword = async () => {
    setLoading(true)
    setResetError(undefined)
    try {
      await api(`/api/admin/customers/${id}`, { method: 'PATCH', body: { password: tempPassword } })
      toast({ title: 'Temporary password set', description: `Share it with ${name} privately. They can change it in My account.` })
      setResetOpen(false)
      setTempPassword('')
    } catch (err) {
      setResetError(err instanceof ApiError ? (err.fields.password ?? err.message) : 'Could not set password.')
    } finally {
      setLoading(false)
    }
  }

  const run = async () => {
    if (!pending) return
    setLoading(true)
    try {
      await api(`/api/admin/customers/${id}`, { method: 'PATCH', body: pending.body })
      toast({ title: 'Account updated' })
      setPending(null)
      router.refresh()
    } catch (err) {
      toast({ variant: 'error', title: 'Update failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-bone" aria-label={`Actions for ${name}`}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="pop-anim z-50 w-52 rounded-xl border border-line bg-paper p-1 shadow-xl">
            <DropdownMenu.Item className={item} onSelect={() => setPending(role === 'admin' ? { body: { role: 'customer' }, title: `Remove admin access for ${name}?`, description: 'They will no longer be able to open the admin dashboard.', label: 'Remove admin' } : { body: { role: 'admin' }, title: `Make ${name} an admin?`, description: 'Admins can manage products, orders, customers and store settings.', label: 'Make admin' })}>
              {role === 'admin' ? 'Remove admin access' : 'Make admin'}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={() => setResetOpen(true)}>
              Set temporary password
            </DropdownMenu.Item>
            <DropdownMenu.Item className={`${item} ${disabled ? '' : 'text-accent'}`} onSelect={() => setPending(disabled ? { body: { disabled: false }, title: `Re-enable ${name}?`, description: 'They will be able to log in again.', label: 'Enable account' } : { body: { disabled: true }, title: `Disable ${name}?`, description: 'They will be logged out everywhere and won’t be able to log in. Their orders are kept.', label: 'Disable account' })}>
              {disabled ? 'Enable account' : 'Disable account'}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <Modal open={resetOpen} onOpenChange={setResetOpen} title={`Temporary password for ${name}`} description="They will be logged out everywhere and can sign in with this password, then change it.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            resetPassword()
          }}
          className="space-y-5"
        >
          <Field id={`temp-${id}`} label="Temporary password" hint="At least 8 characters, with a letter and a number." error={resetError}>
            {(a) => <input {...a} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} autoComplete="off" className="field font-mono" />}
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Set password</Button>
          </div>
        </form>
      </Modal>
      <Confirm open={!!pending} onOpenChange={(o) => !o && setPending(null)} title={pending?.title ?? ''} description={pending?.description ?? ''} confirmLabel={pending?.label ?? 'Confirm'} danger={pending?.body.disabled === true} loading={loading} onConfirm={run} />
    </>
  )
}
