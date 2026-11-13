import type { Metadata } from 'next'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { getSettings } from '@/server/repos/settings'

export const metadata: Metadata = { title: 'Settings' }

export default async function AdminSettings() {
  return <SettingsForm settings={await getSettings()} />
}
