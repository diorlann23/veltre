'use client'

import { useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Search, X } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'
import { useToast } from '@/components/ui/Toaster'
import { api } from '@/lib/client/api'
import { compressImage } from '@/lib/client/image'

export function AdminHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-mute">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function SearchForm({ defaultValue, placeholder, hidden }: { defaultValue: string; placeholder: string; hidden?: Record<string, string> }) {
  return (
    <form role="search" className="relative w-full sm:max-w-xs">
      {Object.entries(hidden ?? {}).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-mute" aria-hidden="true" />
      <input name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder} className="field rounded-full pl-11" />
    </form>
  )
}

export function FilterTabs({ tabs, active }: { tabs: { label: string; href: string; value: string }[]; active: string }) {
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto" aria-label="Filter">
      {tabs.map((t) => (
        <Link key={t.value} href={t.href} aria-current={t.value === active ? 'page' : undefined} className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${t.value === active ? 'bg-ink text-paper' : 'text-mute hover:bg-bone hover:text-ink'}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  )
}

export function Pagination({ page, pages, basePath, params = {} }: { page: number; pages: number; basePath: string; params?: Record<string, string> }) {
  if (pages <= 1) return null
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...params, page: p > 1 ? String(p) : '' }).filter(([, v]) => v))
    return q.size ? `${basePath}?${q}` : basePath
  }
  const btn = 'inline-flex h-9 items-center gap-1 rounded-full border border-line px-3 text-sm hover:border-ink'
  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-2">
      {page > 1 && <Link href={href(page - 1)} className={btn}><ChevronLeft className="size-4" aria-hidden="true" /> Prev</Link>}
      <span className="px-2 text-sm text-mute tabular-nums">{page} / {pages}</span>
      {page < pages && <Link href={href(page + 1)} className={btn}>Next <ChevronRight className="size-4" aria-hidden="true" /></Link>}
    </nav>
  )
}

export interface UploadedImage {
  id: string
  url: string
}

export function ImageUploader({
  images,
  onChange,
  max = 12,
  label = 'Add images',
  single,
}: {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  max?: number
  label?: string
  single?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(0)
  const toast = useToast()
  const limit = single ? 1 : max

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const room = single ? 1 : Math.max(0, limit - images.length)
    const list = Array.from(files).slice(0, room)
    if (list.length === 0) return toast({ variant: 'info', title: `Up to ${limit} images` })
    setBusy(list.length)
    const added: UploadedImage[] = []
    for (const file of list) {
      try {
        const data = await compressImage(file)
        added.push(await api<UploadedImage>('/api/images', { body: { data } }))
      } catch (err) {
        toast({ variant: 'error', title: `Couldn’t upload ${file.name}`, description: err instanceof Error ? err.message : undefined })
      }
      setBusy((b) => b - 1)
    }
    onChange(single ? added.slice(0, 1) : [...images, ...added])
    if (input.current) input.current.value = ''
  }

  const move = (i: number, d: number) => {
    const next = [...images]
    const [it] = next.splice(i, 1)
    next.splice(i + d, 0, it)
    onChange(next)
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <li key={img.id} className="group relative h-28 w-22 overflow-hidden rounded-xl bg-bone ring-1 ring-line">
            <SmartImage src={img.url} alt={`Image ${i + 1}`} className="size-full object-cover" />
            {i === 0 && !single && <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium text-paper">Main</span>}
            <button type="button" onClick={() => onChange(images.filter((x) => x.id !== img.id))} className="absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-full bg-paper/90 text-ink shadow" aria-label={`Remove image ${i + 1}`}>
              <X className="size-3.5" aria-hidden="true" />
            </button>
            {!single && images.length > 1 && (
              <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                {i > 0 && <button type="button" onClick={() => move(i, -1)} className="inline-flex size-6 items-center justify-center rounded-full bg-paper/90 shadow" aria-label="Move left"><ChevronLeft className="size-3.5" aria-hidden="true" /></button>}
                {i < images.length - 1 && <button type="button" onClick={() => move(i, 1)} className="inline-flex size-6 items-center justify-center rounded-full bg-paper/90 shadow" aria-label="Move right"><ChevronRight className="size-3.5" aria-hidden="true" /></button>}
              </div>
            )}
          </li>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <li key={`busy-${i}`} className="flex h-28 w-22 items-center justify-center rounded-xl bg-bone ring-1 ring-line">
            <Loader2 className="size-5 animate-spin text-mute" aria-label="Uploading" />
          </li>
        ))}
        {(single ? images.length === 0 && busy === 0 : images.length + busy < limit) && (
          <li>
            <button type="button" onClick={() => input.current?.click()} className="flex h-28 w-22 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-mute-soft text-xs text-mute transition hover:border-ink hover:text-ink">
              <ImagePlus className="size-5" aria-hidden="true" />
              {label}
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic" multiple={!single} hidden onChange={(e) => upload(e.target.files)} />
    </div>
  )
}
