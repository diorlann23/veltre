'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './launch-splash.css'

export const LAUNCH_SPLASH_ID = 'launch-splash'
const SEEN_KEY = 'veltre:launched'
const SPLASH_BG = '#050504'
/** How long the intro takes to play, measured from when the splash first paints. */
const INTRO_MS = 2900
const REDUCED_INTRO_MS = 900
const EXIT_MS = 700

/**
 * Runs before hydration, straight after the splash markup is parsed, so the splash is decided on first paint:
 * skip it if this launch already played it, force it with `?splash` for previewing in a normal browser tab,
 * and paint the status bar to match while it shows.
 */
export const launchSplashScript = `(function(){var s=document.getElementById('${LAUNCH_SPLASH_ID}');if(!s)return;try{var force=/[?&]splash(=|&|$)/.test(location.search)||navigator.standalone===true;if(!force&&sessionStorage.getItem('${SEEN_KEY}'))return s.setAttribute('data-skip','');if(force)s.setAttribute('data-force','');if(getComputedStyle(s).display==='none')return;s.setAttribute('data-start',String(performance.now()));var m=document.querySelector('meta[name="theme-color"]');if(m){s.setAttribute('data-theme-color',m.content);m.content='${SPLASH_BG}'}}catch(e){}})()`

// Deterministic so server and client render the same dust.
const specks = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  size: 1 + ((i * 7) % 3),
  delay: `${((i * 0.29) % 2.2).toFixed(2)}s`,
  duration: `${(3.2 + ((i * 0.53) % 2.4)).toFixed(2)}s`,
  drift: `${((i % 5) - 2) * 9}px`,
}))

export function LaunchSplash({ brand, tagline }: { brand: string; tagline: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (getComputedStyle(el).display === 'none') {
      setGone(true)
      return
    }
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Private mode: the splash simply plays again next time.
    }

    let exitTimer: ReturnType<typeof setTimeout> | undefined
    const leave = () => {
      if (el.dataset.leaving) return
      el.dataset.leaving = 'true'
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      if (meta && el.dataset.themeColor) meta.content = el.dataset.themeColor
      exitTimer = setTimeout(() => setGone(true), EXIT_MS)
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elapsed = performance.now() - Number(el.dataset.start ?? performance.now())
    // Hold until the intro has played and the app has hydrated, whichever is later.
    const introTimer = setTimeout(leave, Math.max(300, (reduced ? REDUCED_INTRO_MS : INTRO_MS) - elapsed))
    el.addEventListener('pointerdown', leave)
    return () => {
      clearTimeout(introTimer)
      clearTimeout(exitTimer)
      el.removeEventListener('pointerdown', leave)
    }
  }, [])

  if (gone) return null

  return (
    <div ref={ref} id={LAUNCH_SPLASH_ID} className="launch-splash" aria-hidden="true" suppressHydrationWarning>
      <div className="ls-glow" />
      <div className="ls-dust">
        {specks.map((s, i) => (
          <span
            key={i}
            style={{ left: s.left, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.duration, '--drift': s.drift } as CSSProperties}
          />
        ))}
      </div>

      <div className="ls-stage">
        <div className="ls-emblem">
          <svg className="ls-ring" viewBox="0 0 200 200" fill="none">
            <defs>
              <linearGradient id="ls-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7a5a24" />
                <stop offset="0.45" stopColor="#f3d68a" />
                <stop offset="0.55" stopColor="#fff2c2" />
                <stop offset="1" stopColor="#8a6a2f" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="97" stroke="url(#ls-gold)" strokeWidth="0.7" pathLength={1} />
            <circle className="ls-ring-inner" cx="100" cy="100" r="90" stroke="url(#ls-gold)" strokeWidth="0.35" pathLength={1} />
          </svg>
          <div className="ls-mark">
            <img src="/icons/splash-mark.png" alt="" width={476} height={480} fetchPriority="high" />
            <span className="ls-shine" />
          </div>
        </div>

        <p className="ls-word">
          {Array.from(brand).map((ch, i) => (
            <span key={i} style={{ '--i': i } as CSSProperties}>
              {ch}
            </span>
          ))}
        </p>
        <span className="ls-rule" />
        {tagline && <p className="ls-tag">{tagline}</p>}
      </div>
    </div>
  )
}
