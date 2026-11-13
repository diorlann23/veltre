'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SmartImage } from '@/components/ui/SmartImage'

export function ProductGallery({ images, alt, dimmed }: { images: string[]; alt: string; dimmed?: boolean }) {
  const [index, setIndex] = useState(0)
  const touchX = useRef<number | null>(null)
  const list = images.length ? images : ['']
  const i = Math.min(index, list.length - 1)
  const many = list.length > 1
  const go = (d: number) => setIndex((n) => (Math.min(n, list.length - 1) + d + list.length) % list.length)

  return (
    <div className="lg:sticky lg:top-28">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-bone"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || !many) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        <SmartImage
          key={list[i]}
          src={list[i] || null}
          alt={`${alt} — image ${i + 1} of ${list.length}`}
          priority
          className={`absolute inset-0 size-full animate-fade-in object-cover ${dimmed ? 'grayscale-[40%]' : ''}`}
        />
        {many && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 backdrop-blur hover:bg-paper" aria-label="Previous image">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-paper/85 backdrop-blur hover:bg-paper" aria-label="Next image">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-paper/85 px-2.5 py-1 text-xs font-medium tabular-nums backdrop-blur">
              {i + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {many && (
        <ul className="no-scrollbar mt-3 flex gap-3 overflow-x-auto p-1">
          {list.map((src, n) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(n)}
                aria-label={`Show image ${n + 1}`}
                aria-current={n === i}
                className={`block h-24 w-20 overflow-hidden rounded-xl bg-bone transition ${n === i ? 'ring-1 ring-ink ring-offset-2 ring-offset-paper' : 'opacity-60 hover:opacity-100'}`}
              >
                <SmartImage src={src} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
