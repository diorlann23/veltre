import type { ReactNode } from 'react'
import { AccountNav } from '@/components/store/AccountForms'
import { requireUserPage } from '@/server/auth'

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUserPage('/account')
  return (
    <div className="container-x pt-8 lg:pt-14">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Hi, {user.name.split(' ')[0]}</h1>
        </div>
        <AccountNav isAdmin={user.role === 'admin'} />
      </header>
      <div className="pt-8 lg:pt-12">{children}</div>
    </div>
  )
}
