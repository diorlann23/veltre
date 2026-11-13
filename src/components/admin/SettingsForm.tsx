'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs } from 'radix-ui'
import { Button } from '@/components/ui/Button'
import { Field, FormError } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toaster'
import { ApiError, api } from '@/lib/client/api'
import { toCedis, toPesewas } from '@/lib/money'
import type { StoreSettings } from '@/lib/types'
import { AdminHeader, ImageUploader, type UploadedImage } from './AdminUI'

const img = (id: string | null, url: string | null): UploadedImage[] => (id && url ? [{ id, url }] : [])

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  )
}

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter()
  const toast = useToast()
  const [s, setS] = useState(settings)
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee === null ? '' : toCedis(settings.deliveryFee))
  const [hero, setHero] = useState(img(settings.heroImageId, settings.heroImage))
  const [about, setAbout] = useState(img(settings.aboutImageId, settings.aboutImage))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const text = (key: keyof StoreSettings, label: string, opts: { hint?: string; multiline?: number; optional?: boolean; placeholder?: string } = {}) => (
    <Field id={`s-${key}`} label={label} hint={opts.hint} optional={opts.optional} error={errors[key]}>
      {(a) =>
        opts.multiline ? (
          <textarea {...a} rows={opts.multiline} value={s[key] as string} onChange={(e) => setS({ ...s, [key]: e.target.value })} className="field resize-y" placeholder={opts.placeholder} />
        ) : (
          <input {...a} value={s[key] as string} onChange={(e) => setS({ ...s, [key]: e.target.value })} className="field" placeholder={opts.placeholder} />
        )
      }
    </Field>
  )
  const nested = <G extends 'contact' | 'social'>(group: G, key: keyof StoreSettings[G] & string, label: string, placeholder?: string) => (
    <Field id={`s-${group}-${key}`} label={label} optional error={errors[`${group}.${key}`]}>
      {(a) => (
        <input {...a} value={s[group][key] as string} placeholder={placeholder} onChange={(e) => setS({ ...s, [group]: { ...s[group], [key]: e.target.value } })} className="field" />
      )}
    </Field>
  )

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const fee = deliveryFee.trim() === '' ? null : toPesewas(deliveryFee)
    if (fee !== null && (!Number.isFinite(fee) || fee < 0)) return setErrors({ deliveryFee: 'Enter a valid amount or leave empty' })
    const { heroImage: _h, aboutImage: _a, ...rest } = s
    setSaving(true)
    try {
      await api('/api/settings', { method: 'PUT', body: { ...rest, deliveryFee: fee, heroImageId: hero[0]?.id ?? null, aboutImageId: about[0]?.id ?? null } })
      setErrors({})
      toast({ title: 'Settings saved' })
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields)
      setFormError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const tab = 'rounded-full px-4 py-2 text-sm font-medium text-mute transition data-[state=active]:bg-ink data-[state=active]:text-paper hover:text-ink data-[state=active]:hover:text-paper'

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <AdminHeader title="Settings" description="Everything customers see about your store.">
        <Button type="submit" loading={saving}>Save settings</Button>
      </AdminHeader>
      <FormError message={formError} />
      <Tabs.Root defaultValue="store">
        <Tabs.List className="no-scrollbar mb-6 flex gap-1 overflow-x-auto" aria-label="Settings sections">
          <Tabs.Trigger value="store" className={tab}>Store</Tabs.Trigger>
          <Tabs.Trigger value="ordering" className={tab}>Ordering</Tabs.Trigger>
          <Tabs.Trigger value="contact" className={tab}>Contact & social</Tabs.Trigger>
          <Tabs.Trigger value="pages" className={tab}>Homepage & About</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="store" className="grid gap-6 xl:grid-cols-2">
          <Card title="Brand">
            {text('brandName', 'Brand name')}
            {text('tagline', 'Tagline', { optional: true })}
            {text('description', 'Short description', { multiline: 3, hint: 'Used in the footer and search results.' })}
          </Card>
          <Card title="Inventory">
            <Field id="s-low" label="Low stock warning at" hint="Show “Only X left” at or below this many units." error={errors.lowStockThreshold}>
              {(a) => <input {...a} inputMode="numeric" value={String(s.lowStockThreshold)} onChange={(e) => setS({ ...s, lowStockThreshold: Number(e.target.value.replace(/\D/g, '')) || 0 })} className="field w-28" />}
            </Field>
            <Field id="s-max" label="Max quantity per item" error={errors.maxQuantityPerItem}>
              {(a) => <input {...a} inputMode="numeric" value={String(s.maxQuantityPerItem)} onChange={(e) => setS({ ...s, maxQuantityPerItem: Number(e.target.value.replace(/\D/g, '')) || 1 })} className="field w-28" />}
            </Field>
            {text('orderPrefix', 'Order number prefix', { hint: '2–5 letters, e.g. VLT → VLT-261016-K7QZ2M' })}
          </Card>
        </Tabs.Content>
        <Tabs.Content value="ordering" className="grid gap-6 xl:grid-cols-2">
          <Card title="WhatsApp ordering">
            {text('whatsappNumber', 'Seller WhatsApp number', { hint: 'International format, digits only. 0599967302 → 233599967302' })}
          </Card>
          <Card title="Delivery">
            <Field id="s-fee" label="Flat delivery fee (GH₵)" optional hint="Leave empty if fees vary — customers will be told it’s confirmed on WhatsApp." error={errors.deliveryFee}>
              {(a) => <input {...a} inputMode="decimal" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="field w-40 tabular-nums" />}
            </Field>
            {text('deliveryInfo', 'Delivery information', { multiline: 3 })}
          </Card>
          <Card title="Policies">
            {text('paymentInfo', 'How customers pay', { multiline: 3, hint: 'e.g. Mobile Money (MTN, Telecel) or cash on delivery.' })}
            {text('exchangesInfo', 'Exchanges & returns', { multiline: 3 })}
          </Card>
        </Tabs.Content>
        <Tabs.Content value="contact" className="grid gap-6 xl:grid-cols-2">
          <Card title="Contact details">
            {nested('contact', 'phone', 'Phone (shown on site)', '+233 59 996 7302')}
            {nested('contact', 'email', 'Email')}
            {nested('contact', 'location', 'Location', 'Accra, Ghana')}
            {nested('contact', 'hours', 'Opening hours', 'Mon – Sat, 9am – 6pm')}
          </Card>
          <Card title="Social links">
            {nested('social', 'instagram', 'Instagram', 'https://instagram.com/yourbrand')}
            {nested('social', 'tiktok', 'TikTok', 'https://tiktok.com/@yourbrand')}
            {nested('social', 'snapchat', 'Snapchat')}
            {nested('social', 'x', 'X')}
            {nested('social', 'facebook', 'Facebook')}
          </Card>
        </Tabs.Content>
        <Tabs.Content value="pages" className="grid gap-6 xl:grid-cols-2">
          <Card title="Homepage hero">
            {text('heroHeading', 'Heading')}
            {text('heroText', 'Text', { multiline: 3 })}
            <div>
              <p className="mb-2 text-sm font-medium">Hero image</p>
              <ImageUploader single images={hero} onChange={setHero} label="Upload" />
            </div>
          </Card>
          <Card title="About page">
            {text('aboutHeading', 'Heading')}
            {text('aboutBody', 'Story', { multiline: 8, hint: 'Separate paragraphs with a blank line.' })}
            <div>
              <p className="mb-2 text-sm font-medium">About image</p>
              <ImageUploader single images={about} onChange={setAbout} label="Upload" />
            </div>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </form>
  )
}
