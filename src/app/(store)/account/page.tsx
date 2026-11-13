import type { Metadata } from 'next'
import { PasswordForm, ProfileForm } from '@/components/store/AccountForms'
import { requireUserPage } from '@/server/auth'

export const metadata: Metadata = { title: 'My account', robots: { index: false } }

export default async function AccountPage() {
  const user = await requireUserPage('/account')
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  )
}
