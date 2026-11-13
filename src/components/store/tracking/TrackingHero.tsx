import type { OrderStatus } from '@/lib/types'
import { STATUS_COPY } from '@/lib/tracking'
import './tracking.css'

/** An isometric parcel carrying the monogram, with a location pin and ripples beneath it. */
function Parcel() {
  return (
    <svg viewBox="0 0 320 300" className="h-auto w-full max-w-[300px] overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="tk-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7c08a" />
          <stop offset="1" stopColor="#c99a62" />
        </linearGradient>
        <linearGradient id="tk-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d2a36c" />
          <stop offset="1" stopColor="#ad7c47" />
        </linearGradient>
        <linearGradient id="tk-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a87442" />
          <stop offset="1" stopColor="#7b5130" />
        </linearGradient>
        <linearGradient id="tk-ember" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5b261" />
          <stop offset="1" stopColor="#e2611f" />
        </linearGradient>
        <radialGradient id="tk-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e8772e" stopOpacity="0.55" />
          <stop offset="1" stopColor="#e8772e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="252" rx="150" ry="40" fill="url(#tk-floor)" />
      <g fill="none" stroke="#f08a3e" strokeWidth="1.6">
        <ellipse className="tk-ring" cx="160" cy="252" rx="140" ry="34" />
        <ellipse className="tk-ring" cx="160" cy="252" rx="140" ry="34" />
        <ellipse className="tk-ring" cx="160" cy="252" rx="140" ry="34" />
      </g>

      <g className="tk-box">
        <ellipse cx="160" cy="250" rx="86" ry="14" fill="#000" opacity="0.45" />
        {/* faces */}
        <path d="M160 72 250 117 160 162 70 117Z" fill="url(#tk-top)" />
        <path d="M70 117 160 162V262L70 217Z" fill="url(#tk-left)" />
        <path d="M160 162 250 117V217L160 262Z" fill="url(#tk-right)" />
        {/* flap seam and tape */}
        <path d="M115 94.5 205 139.5" stroke="#9c7040" strokeWidth="1" opacity="0.6" />
        <path d="M107.8 90.9 197.8 135.9 212.2 143.1 122.2 98.1Z" fill="#e9cf9f" opacity="0.85" />
        <path d="M198 143 212 136V236L198 243Z" fill="#c9a26f" opacity="0.8" />
        {/* edge highlights */}
        <path d="M70 117 160 162 250 117" fill="none" stroke="#f3d7a8" strokeWidth="1" opacity="0.7" />
        <path d="M160 162V262" stroke="#6d4526" strokeWidth="1" opacity="0.5" />
        {/* monogram printed on the side */}
        <g transform="matrix(1 0.5 0 1 0 82)">
          <image href="/icons/splash-mark.png" x="88" y="16" width="54" height="54" />
          <text x="115" y="86" textAnchor="middle" fontSize="9.5" fontWeight="700" letterSpacing="3" fill="#5b3a1f" opacity="0.75">
            VELTRÉ
          </text>
        </g>
      </g>

      <g className="tk-pin">
        <circle cx="160" cy="40" r="22" fill="#e8772e" opacity="0.25" />
        <path d="M160 64c-1.2 0-17-15.4-17-28a17 17 0 0 1 34 0c0 12.6-15.8 28-17 28Z" fill="url(#tk-ember)" />
        <circle cx="160" cy="36" r="6.5" fill="#1a1208" />
      </g>
    </svg>
  )
}

export function TrackingHero({ status }: { status: OrderStatus }) {
  const copy = STATUS_COPY[status]
  return (
    <section className="on-dark relative isolate overflow-hidden rounded-3xl bg-ink text-paper">
      <div aria-hidden="true" className="absolute -top-24 -right-16 -z-10 size-[28rem] rounded-full bg-ember/25 blur-3xl" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
      />
      <div className="grid items-center gap-2 p-6 sm:grid-cols-[1.25fr_1fr] sm:gap-6 sm:p-10">
        <div className="animate-fade-up">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-ember-soft uppercase">Order tracking</p>
          <h2 className="mt-3 text-[2.5rem] leading-[1.02] font-semibold tracking-tight sm:text-5xl">
            {copy.lead}
            <br />
            <span className={status === 'cancelled' ? 'text-paper/60' : 'tk-gradient-text'}>{copy.highlight}</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/70">{copy.intro}</p>
        </div>
        <div className={`mx-auto w-full max-w-[260px] sm:max-w-[300px] ${status === 'cancelled' ? 'tk-muted' : ''}`}>
          <Parcel />
        </div>
      </div>
    </section>
  )
}
