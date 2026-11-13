'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { Confirm, Modal } from '@/components/ui/Modal'
import { SmartImage } from '@/components/ui/SmartImage'
import { useToast } from '@/components/ui/Toaster'
import { ApiError, api } from '@/lib/client/api'
import { pluralize } from '@/lib/money'
import type { Category } from '@/lib/types'
import { AdminHeader, ImageUploader, type UploadedImage } from './AdminUI'

interface Draft {
  id?: string
  name: string
  slug: string
  description: string
  image: UploadedImage[]
  sortOrder: string
}

const empty: Draft = { name: '', slug: '', description: '', image: [], sortOrder: '0' }

export function CollectionsManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const toast = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [busyDelete, setBusyDelete] = useState(false)

  const open = (c?: Category) => {
    setErrors({})
    setFormError(null)
    setDraft(
      c
        ? { id: c.id, name: c.name, slug: c.slug, description: c.description, image: c.imageId && c.image ? [{ id: c.imageId, url: c.image }] : [], sortOrder: String(c.sortOrder) }
        : { ...empty, sortOrder: String(categories.length) },
    )
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft) return
    setSaving(true)
    setFormError(null)
    try {
      const body = { name: draft.name, slug: draft.slug, description: draft.description, imageId: draft.image[0]?.id ?? null, sortOrder: Number(draft.sortOrder) || 0 }
      await api(draft.id ? `/api/categories/${draft.id}` : '/api/categories', { method: draft.id ? 'PUT' : 'POST', body })
      toast({ title: draft.id ? 'Collection saved' : 'Collection created' })
      setDraft(null)
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      setFormError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusyDelete(true)
    try {
      await api(`/api/categories/${deleting.id}`, { method: 'DELETE' })
      toast({ title: 'Collection deleted' })
      setDeleting(null)
      router.refresh()
    } catch (err) {
      toast({ variant: 'error', title: 'Could not delete', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusyDelete(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Collections" description="Group products into collections shown in the shop, homepage and filters.">
        <Button onClick={() => open()}><Plus className="size-4" aria-hidden="true" /> New collection</Button>
      </AdminHeader>
      {categories.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <p className="font-medium">No collections yet.</p>
          <p className="mt-1 text-sm text-mute">Create collections like “Essentials” or “Cargo” to organise your products.</p>
          <Button className="mt-5" onClick={() => open()}>Create a collection</Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id} className="card flex gap-4 p-4">
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-bone">{c.image && <SmartImage src={c.image} alt="" className="size-full object-cover" />}</div>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-mute">/shop?category={c.slug} · {pluralize(c.productCount, 'active product')}</p>
                {c.description && <p className="mt-1 line-clamp-2 text-sm text-mute">{c.description}</p>}
                <div className="mt-auto flex gap-1 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => open(c)}><Pencil className="size-3.5" aria-hidden="true" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-accent" onClick={() => setDeleting(c)}><Trash2 className="size-3.5" aria-hidden="true" /> Delete</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? 'Edit collection' : 'New collection'}>
        {draft && (
          <form onSubmit={save} noValidate className="space-y-5">
            <FormError message={formError} />
            <Field id="c-name" label="Name" error={errors.name}>
              {(a) => <input {...a} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" />}
            </Field>
            <Field id="c-slug" label="URL" optional hint="Leave empty to create from the name." error={errors.slug}>
              {(a) => <input {...a} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })} className="field" />}
            </Field>
            <Field id="c-desc" label="Description" optional error={errors.description}>
              {(a) => <textarea {...a} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="field resize-y" />}
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium">Cover image</p>
              <ImageUploader single images={draft.image} onChange={(image) => setDraft({ ...draft, image })} label="Upload" />
            </div>
            <Field id="c-order" label="Display order" hint="Lower numbers appear first." error={errors.sortOrder}>
              {(a) => <input {...a} inputMode="numeric" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value.replace(/\D/g, '') })} className="field w-28" />}
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
      <Confirm open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title={`Delete “${deleting?.name}”?`} description="Products in this collection will be kept, but will no longer belong to a collection." confirmLabel="Delete" danger loading={busyDelete} onConfirm={remove} />
    </div>
  )
}
