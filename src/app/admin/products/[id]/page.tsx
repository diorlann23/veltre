import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ObjectId } from 'mongodb'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { listCategories } from '@/server/repos/categories'
import { getAdminProduct } from '@/server/repos/products'

export const metadata: Metadata = { title: 'Edit product' }

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f0-9]{24}$/.test(id)) notFound()
  const [product, categories] = await Promise.all([getAdminProduct(new ObjectId(id)), listCategories()])
  if (!product) notFound()
  return <ProductEditor key={product.updatedAt} product={product} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
}
