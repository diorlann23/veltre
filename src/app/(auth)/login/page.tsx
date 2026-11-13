import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'
import { getCurrentUser } from '@/server/auth'

export const metadata: Metadata = { title: 'Log in', robots: { index: false } }

export default async function Page() {
  if (await getCurrentUser()) redirect('/account')
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  )
}
