'use client'

import { useState, type ReactNode } from 'react'
import { RadioGroup } from 'radix-ui'
import { ShoppingBag } from 'lucide-react'
import { useCart, useSettings } from '@/components/providers/AppProviders'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/bits'
import { useToast } from '@/components/ui/Toaster'
import { cartKey } from '@/lib/cart'
import { colorHasStock, galleryFor, isInStock, sizeHasStock, stockLevel, variantStock } from '@/lib/catalog'
import type { Product } from '@/lib/types'
import { ProductGallery } from './ProductGallery'

export function ProductPurchase({ product, children, after }: { product: Product; children: ReactNode; after?: ReactNode }) {
  const { items, add, setDrawerOpen } = useCart()
  const settings = useSettings()
  const toast = useToast()
  const [color, setColor] = useState<string | null>(product.colors.length === 1 ? product.colors[0].name : null)
  const [size, setSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [errors, setErrors] = useState<{ color?: string; size?: string }>({})

  const inStock = isInStock(product)
  const units = color && size ? variantStock(product.variants, color, size) : null
  const inCart = color && size ? (items.find((i) => cartKey(i) === cartKey({ productId: product.id, color, size }))?.quantity ?? 0) : 0
  const max = units === null ? settings.maxQuantityPerItem : Math.min(units, settings.maxQuantityPerItem)
  const addable = Math.max(0, max - inCart)
  const qty = Math.max(1, Math.min(quantity, addable || 1))
  const level = units === null ? null : stockLevel(units, settings.lowStockThreshold)

  const onAdd = () => {
    const next = { color: color ? undefined : 'Please select a colour.', size: size ? undefined : 'Please select a size.' }
    setErrors(next)
    if (!color || !size) return
    const { added, capped } = add({ productId: product.id, color, size, quantity: qty }, max)
    const desc = `${product.name} — ${color} / ${size}`
    if (added === 0) {
      toast({ variant: 'info', title: 'Already at maximum quantity', description: `Your cart holds all available ${color} / ${size}.` })
      return
    }
    toast({
      variant: capped ? 'info' : 'success',
      title: capped ? `Added ${added} — stock limit reached` : `Added ${added} to cart`,
      description: desc,
      action: { label: 'View cart', onClick: () => setDrawerOpen(true) },
    })
    setQuantity(1)
  }

  const swatch = 'relative flex items-center gap-2 rounded-full border border-line bg-white/50 py-2 pr-3.5 pl-2 text-sm transition hover:border-ink data-[state=checked]:border-ink data-[state=checked]:bg-white data-[state=checked]:ring-1 data-[state=checked]:ring-ink'
  const sizeBtn = 'relative flex h-12 items-center justify-center rounded-xl border border-line bg-white/50 text-sm font-medium transition hover:border-ink data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-paper disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-mute-soft disabled:line-through'

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <ProductGallery key={color ?? 'default'} images={galleryFor(product, color)} alt={product.name} dimmed={!inStock} />
      </div>
      <div className="lg:col-span-5">
        {children}
        {!inStock ? (
          <div className="mt-8 rounded-2xl border border-line bg-bone/50 p-5">
            <p className="font-medium">Sold out</p>
            <p className="mt-1 text-sm text-mute">This style is currently unavailable. Message us on WhatsApp to ask about restocks.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-7">
            <fieldset>
              <legend className="text-sm font-medium">
                Colour{color && <span className="ml-2 font-normal text-mute">{color}</span>}
              </legend>
              <RadioGroup.Root
                value={color ?? ''}
                onValueChange={(c) => {
                  setColor(c)
                  setErrors((e) => ({ ...e, color: undefined }))
                  if (size && !sizeHasStock(product.variants, size, c)) setSize(null)
                }}
                aria-label="Colour"
                className="mt-3 flex flex-wrap gap-2.5"
              >
                {product.colors.map((c) => {
                  const ok = colorHasStock(product.variants, c.name)
                  return (
                    <RadioGroup.Item key={c.name} value={c.name} disabled={!ok} className={`${swatch} disabled:cursor-not-allowed disabled:opacity-50`}>
                      <span className="size-5 shrink-0 rounded-full ring-1 ring-black/15" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                      <span className={ok ? '' : 'line-through'}>{c.name}</span>
                      {!ok && <span className="sr-only">(sold out)</span>}
                    </RadioGroup.Item>
                  )
                })}
              </RadioGroup.Root>
              {errors.color && <p className="mt-2 text-sm text-accent" role="alert">{errors.color}</p>}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium">
                Size{size && <span className="ml-2 font-normal text-mute">{size}</span>}
              </legend>
              <RadioGroup.Root
                value={size ?? ''}
                onValueChange={(s) => {
                  setSize(s)
                  setErrors((e) => ({ ...e, size: undefined }))
                }}
                aria-label="Size"
                className="mt-3 grid grid-cols-5 gap-2 sm:max-w-sm"
              >
                {product.sizes.map((s) => {
                  const ok = sizeHasStock(product.variants, s, color)
                  return (
                    <RadioGroup.Item key={s} value={s} disabled={!ok} className={sizeBtn}>
                      {s}
                      {!ok && <span className="sr-only">(sold out)</span>}
                    </RadioGroup.Item>
                  )
                })}
              </RadioGroup.Root>
              {errors.size && <p className="mt-2 text-sm text-accent" role="alert">{errors.size}</p>}
            </fieldset>

            <div className="min-h-5 text-sm" aria-live="polite">
              {level === 'low-stock' && <p className="text-accent">Only {units} left in this size</p>}
              {level === 'in-stock' && <p className="text-success">In stock</p>}
              {level === 'sold-out' && <p className="text-mute">Sold out in this size</p>}
              {inCart > 0 && <p className="mt-1 text-mute">{inCart} already in your cart{addable === 0 ? ' — that is all we have available' : ''}.</p>}
            </div>

            <div className="flex gap-3">
              <QuantityStepper value={qty} max={Math.max(1, addable)} onChange={setQuantity} label={`Quantity of ${product.name}`} />
              <Button size="lg" className="flex-1" onClick={onAdd} disabled={!!(color && size && addable === 0)}>
                <ShoppingBag className="size-4" aria-hidden="true" />
                {color && size && addable === 0 ? 'Max in cart' : 'Add to cart'}
              </Button>
            </div>
            {(!color || !size) && <p className="-mt-3 text-xs text-mute">Select a colour and size to add this item to your cart.</p>}
          </div>
        )}
        {after}
      </div>
    </div>
  )
}
