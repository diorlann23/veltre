import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AdminNav } from '@/components/admin/AdminNav'
import { requireAdminPage } from '@/server/auth'
import { collections } from '@/server/db'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin' }, robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage()
  const pending = await (await collections()).orders.countDocuments({ status: 'pending' })
  return (
    <div className="min-h-dvh lg:flex">
      <AdminNav pendingOrders={pending} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  )
}
