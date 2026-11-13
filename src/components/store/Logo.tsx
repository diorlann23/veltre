'use client'

import Link from 'next/link'
import { useSettings } from '@/components/providers/AppProviders'

export function Logo({ className = '', onClick, href = '/' }: { className?: string; onClick?: () => void; href?: string }) {
  const { brandName } = useSettings()
  return (
    <Link href={href} onClick={onClick} className={`inline-flex items-center ${className}`} aria-label={`${brandName} — home`}>
      <span className="wordmark">{brandName}</span>
    </Link>
  )
}
