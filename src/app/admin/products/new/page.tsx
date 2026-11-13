import type { Metadata } from 'next'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { listCategories } from '@/server/repos/categories'

export const metadata: Metadata = { title: 'New product' }

export default async function NewProduct() {
  const categories = await listCategories()
  return <ProductEditor categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
}
