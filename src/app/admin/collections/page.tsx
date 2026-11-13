import type { Metadata } from 'next'
import { CollectionsManager } from '@/components/admin/CollectionsManager'
import { listCategories } from '@/server/repos/categories'

export const metadata: Metadata = { title: 'Collections' }

export default async function AdminCollections() {
  return <CollectionsManager categories={await listCategories()} />
}
