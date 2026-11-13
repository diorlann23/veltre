'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const INTERVAL_MS = 30_000

/** Re-fetches the page's server data while it's visible, so status changes appear without a reload. */
export function LiveRefresh() {
  const router = useRouter()
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const id = setInterval(tick, INTERVAL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [router])
  return null
}
