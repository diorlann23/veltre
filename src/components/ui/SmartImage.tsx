'use client'

import { useState, type ImgHTMLAttributes } from 'react'

const FALLBACK = '/images/fallback.svg'

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined
  alt: string
  priority?: boolean
}

export function SmartImage({ src, alt, priority, className = '', onLoad, onError, ...rest }: SmartImageProps) {
  const [failed, setFailed] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<string | null>(null)
  const wanted = src || FALLBACK
  const current = failed === wanted ? FALLBACK : wanted

  return (
    <img
      {...rest}
      ref={(img) => {
        if (img?.complete && img.naturalWidth > 0 && loaded !== current) setLoaded(current)
      }}
      src={current}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={(e) => {
        setLoaded(current)
        onLoad?.(e)
      }}
      onError={(e) => {
        if (current !== FALLBACK) setFailed(wanted)
        onError?.(e)
      }}
      className={`img-fade ${loaded === current ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
