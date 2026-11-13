'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { Confirm } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Toggle'
import { useToast } from '@/components/ui/Toaster'
import { SIZE_ORDER, sortSizes } from '@/lib/catalog'
import { ApiError, api } from '@/lib/client/api'
import { toCedis, toPesewas } from '@/lib/money'
import type { Product, ProductStatus } from '@/lib/types'
import { ImageUploader, type UploadedImage } from './AdminUI'

interface ColorRow {
  key: string
  name: string
  hex: string
  images: UploadedImage[]
}

const uid = () => Math.random().toString(36).slice(2, 10)
const pair = (ids: string[], urls: string[]) => ids.map((id, i) => ({ id, url: urls[i] }))

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-medium">{title}</h2>
      {description && <p className="mt-1 text-sm text-mute">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

export function ProductEditor({ product, categories }: { product?: Product; categories: { id: string; name: string }[] }) {
  const router = useRouter()
  const toast = useToast()
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [details, setDetails] = useState(product?.details.join('\n') ?? '')
  const [fit, setFit] = useState(product?.fit ?? '')
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? '')
  const [price, setPrice] = useState(product ? toCedis(product.price) : '')
  const [salePrice, setSalePrice] = useState(product?.salePrice ? toCedis(product.salePrice) : '')
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? 'active')
  const [featured, setFeatured] = useState(product?.featured ?? false)
  const [newArrival, setNewArrival] = useState(product?.newArrival ?? true)
  const [images, setImages] = useState<UploadedImage[]>(product ? pair(product.imageIds, product.images) : [])
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? ['S', 'M', 'L', 'XL'])
  const [customSize, setCustomSize] = useState('')
  const [initial] = useState(() => {
    const rows: ColorRow[] = product?.colors.map((c) => ({ key: uid(), name: c.name, hex: c.hex, images: pair(c.imageIds, c.images) })) ?? [{ key: uid(), name: 'Black', hex: '#111111', images: [] }]
    const units: Record<string, string> = {}
    product?.variants.forEach((v) => {
      const row = rows.find((r) => r.name === v.color)
      if (row) units[`${row.key}/${v.size}`] = String(v.stock)
    })
    return { rows, units }
  })
  const [colors, setColors] = useState<ColorRow[]>(initial.rows)
  const [stock, setStock] = useState<Record<string, string>>(initial.units)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const getStock = (c: ColorRow, size: string) => stock[`${c.key}/${size}`] ?? ''
  const setStockValue = (c: ColorRow, size: string, v: string) => setStock((st) => ({ ...st, [`${c.key}/${size}`]: v.replace(/\D/g, '').slice(0, 6) }))
  const totalUnits = colors.reduce((sum, c) => sum + sizes.reduce((s2, s) => s2 + (Number(getStock(c, s)) || 0), 0), 0)

  const toggleSize = (s: string) => setSizes((list) => (list.includes(s) ? list.filter((x) => x !== s) : sortSizes([...list, s])))
  const addCustomSize = () => {
    const s = customSize.trim().toUpperCase().slice(0, 20)
    if (s && !sizes.includes(s)) setSizes(sortSizes([...sizes, s]))
    setCustomSize('')
  }
  const updateColor = (key: string, patch: Partial<ColorRow>) => setColors((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  const fillAll = () => {
    const v = window.prompt('Set stock for every colour and size to:', '10')
    if (v === null || !/^\d+$/.test(v.trim())) return
    const next = { ...stock }
    colors.forEach((c) => sizes.forEach((s) => (next[`${c.key}/${s}`] = v.trim())))
    setStock(next)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const local: Record<string, string> = {}
    const pricePesewas = toPesewas(price)
    const salePesewas = salePrice.trim() ? toPesewas(salePrice) : null
    if (!Number.isFinite(pricePesewas) || pricePesewas <= 0) local.price = 'Enter a valid price'
    if (salePesewas !== null && (!Number.isFinite(salePesewas) || salePesewas <= 0)) local.salePrice = 'Enter a valid sale price'
    if (Object.keys(local).length) {
      setErrors(local)
      return
    }
    const body = {
      name,
      slug,
      description,
      details: details.split('\n').map((d) => d.trim()).filter(Boolean),
      fit,
      categoryId: categoryId || null,
      price: pricePesewas,
      salePrice: salePesewas,
      imageIds: images.map((i) => i.id),
      sizes,
      colors: colors.map((c) => ({ name: c.name.trim(), hex: c.hex, imageIds: c.images.map((i) => i.id) })),
      variants: colors.flatMap((c) => sizes.map((s) => ({ color: c.name.trim(), size: s, stock: Number(getStock(c, s)) || 0 }))),
      featured,
      newArrival,
      status,
    }
    setSaving(true)
    try {
      const res = await api<{ product: Product }>(product ? `/api/products/${product.id}` : '/api/products', { method: product ? 'PUT' : 'POST', body })
      toast({ title: product ? 'Product saved' : 'Product created', description: res.product.name })
      setErrors({})
      if (product) router.refresh()
      else router.push(`/admin/products/${res.product.id}`)
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      setFormError(err instanceof Error ? err.message : 'Could not save the product.')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!product) return
    setDeleting(true)
    try {
      await api(`/api/products/${product.id}`, { method: 'DELETE' })
      toast({ title: 'Product deleted' })
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      toast({ variant: 'error', title: 'Could not delete', description: err instanceof Error ? err.message : undefined })
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/products" className="text-sm text-mute hover:text-ink">← Products</Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{product ? product.name : 'New product'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {product && (
            <Link href={`/product/${product.slug}`} target="_blank" className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line px-5 text-sm font-medium hover:border-ink">
              View <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          )}
          <Button type="submit" loading={saving}>{product ? 'Save changes' : 'Create product'}</Button>
        </div>
      </div>
      <FormError message={formError} />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Section title="Details">
            <Field id="p-name" label="Product name" error={errors.name}>
              {(a) => <input {...a} value={name} onChange={(e) => setName(e.target.value)} className="field" />}
            </Field>
            <Field id="p-slug" label="URL" optional hint={`Leave empty to create from the name. /product/${slug || 'your-product-name'}`} error={errors.slug}>
              {(a) => <input {...a} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} className="field" placeholder="navy-lace-halter-dress" />}
            </Field>
            <Field id="p-description" label="Description" optional error={errors.description}>
              {(a) => <textarea {...a} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="field resize-y" />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="p-details" label="Detail bullet points" optional hint="One per line" error={errors.details}>
                {(a) => <textarea {...a} rows={4} value={details} onChange={(e) => setDetails(e.target.value)} className="field resize-y" placeholder={'Brushed cotton fleece\nRibbed cuffs'} />}
              </Field>
              <Field id="p-fit" label="Size & fit" optional error={errors.fit}>
                {(a) => <textarea {...a} rows={4} value={fit} onChange={(e) => setFit(e.target.value)} className="field resize-y" placeholder="Regular fit, tapered ankle. True to size." />}
              </Field>
            </div>
          </Section>

          <Section title="Photos" description="The first photo is the main image. Photos are compressed in your browser before upload.">
            <ImageUploader images={images} onChange={setImages} />
            {errors.imageIds && <p className="text-sm text-accent">{errors.imageIds}</p>}
          </Section>

          <Section title="Sizes">
            <div className="flex flex-wrap gap-2">
              {[...new Set([...SIZE_ORDER, ...sizes])].map((s) => (
                <button key={s} type="button" aria-pressed={sizes.includes(s)} onClick={() => toggleSize(s)} className={`h-10 min-w-12 rounded-lg border px-3 text-sm font-medium transition ${sizes.includes(s) ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex max-w-xs gap-2">
              <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  e.preventDefault()
                  addCustomSize()
                }} placeholder="Custom size, e.g. 32" aria-label="Custom size" className="field py-2" />
              <Button variant="secondary" size="sm" onClick={addCustomSize} className="h-auto">Add</Button>
            </div>
            {errors.sizes && <p className="text-sm text-accent">{errors.sizes}</p>}
          </Section>

          <Section title="Colours" description="Optional photos per colour replace the main gallery when that colour is selected.">
            <ul className="space-y-4">
              {colors.map((c, i) => (
                <li key={c.key} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="min-w-40 flex-1 text-sm font-medium">
                      Colour name
                      <input value={c.name} onChange={(e) => updateColor(c.key, { name: e.target.value })} className="field mt-2" aria-invalid={!!errors[`colors.${i}.name`]} />
                    </label>
                    <label className="text-sm font-medium">
                      Swatch
                      <span className="mt-2 flex items-center gap-2">
                        <input type="color" value={c.hex} onChange={(e) => updateColor(c.key, { hex: e.target.value })} className="h-11 w-12 cursor-pointer rounded-lg border border-line bg-white p-1" aria-label={`Swatch colour for ${c.name || 'colour'}`} />
                        <input value={c.hex} onChange={(e) => updateColor(c.key, { hex: e.target.value })} className="field w-28 font-mono uppercase" aria-label="Hex code" />
                      </span>
                    </label>
                    {colors.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setColors(colors.filter((x) => x.key !== c.key))} className="h-11" aria-label={`Remove ${c.name || 'colour'}`}>
                        <X className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  {(errors[`colors.${i}.name`] || errors[`colors.${i}.hex`]) && <p className="mt-2 text-sm text-accent">{errors[`colors.${i}.name`] ?? errors[`colors.${i}.hex`]}</p>}
                  <div className="mt-4">
                    <ImageUploader images={c.images} onChange={(imgs) => updateColor(c.key, { images: imgs })} max={8} label="Colour photo" />
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="secondary" size="sm" onClick={() => setColors([...colors, { key: uid(), name: '', hex: '#888888', images: [] }])}>
              <Plus className="size-4" aria-hidden="true" /> Add colour
            </Button>
            {errors.colors && <p className="text-sm text-accent">{errors.colors}</p>}
          </Section>

          <Section title="Stock" description={`Units available for each colour and size. Total: ${totalUnits}.`}>
            {sizes.length === 0 || colors.length === 0 ? (
              <p className="text-sm text-mute">Add sizes and colours first.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="text-sm">
                    <thead>
                      <tr>
                        <th className="pr-3 pb-2 text-left font-medium text-mute">Colour</th>
                        {sizes.map((s) => <th key={s} className="px-1 pb-2 text-center font-medium text-mute">{s}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((c) => (
                        <tr key={c.key}>
                          <td className="py-1 pr-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span className="size-3.5 rounded-full ring-1 ring-black/15" style={{ backgroundColor: c.hex }} />
                              {c.name || 'Unnamed'}
                            </span>
                          </td>
                          {sizes.map((s) => (
                            <td key={s} className="px-1 py-1">
                              <input inputMode="numeric" value={getStock(c, s)} onChange={(e) => setStockValue(c, s, e.target.value)} placeholder="0" aria-label={`Stock for ${c.name} size ${s}`} className="field w-16 px-2 py-2 text-center tabular-nums" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="ghost" size="sm" onClick={fillAll}>Set all to…</Button>
              </>
            )}
          </Section>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Section title="Status">
            <Select label="Status" value={status} onValueChange={(v) => setStatus(v as ProductStatus)} className="w-full" options={[{ value: 'active', label: 'Active — visible in store' }, { value: 'draft', label: 'Draft — hidden' }, { value: 'archived', label: 'Archived — hidden' }]} />
            <Switch id="p-featured" label="Featured" description="Show on the homepage." checked={featured} onCheckedChange={setFeatured} />
            <Switch id="p-new" label="New arrival" description="Show a “New” badge." checked={newArrival} onCheckedChange={setNewArrival} />
          </Section>
          <Section title="Pricing (GH₵)">
            <Field id="p-price" label="Price" error={errors.price}>
              {(a) => <input {...a} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="field tabular-nums" placeholder="320.00" />}
            </Field>
            <Field id="p-sale" label="Sale price" optional hint="Must be lower than the price. Leave empty for no sale." error={errors.salePrice}>
              {(a) => <input {...a} inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="field tabular-nums" placeholder="280.00" />}
            </Field>
          </Section>
          <Section title="Collection">
            {categories.length === 0 ? (
              <p className="text-sm text-mute">No collections yet. <Link href="/admin/collections" className="underline">Create one</Link>.</p>
            ) : (
              <Select label="Collection" value={categoryId || 'none'} onValueChange={(v) => setCategoryId(v === 'none' ? '' : v)} className="w-full" options={[{ value: 'none', label: 'No collection' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
            )}
          </Section>
          {product && (
            <Section title="Danger zone">
              <Button variant="ghost" className="text-accent" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden="true" /> Delete product
              </Button>
              <p className="text-xs text-mute">Tip: set the status to Archived to hide it but keep it for later.</p>
            </Section>
          )}
        </div>
      </div>
      <Confirm open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this product?" description="It will be removed from the store and from customers’ carts. Past orders keep their details." confirmLabel="Delete" danger loading={deleting} onConfirm={onDelete} />
    </form>
  )
}
