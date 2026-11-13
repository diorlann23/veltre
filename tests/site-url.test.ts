import { describe, expect, it } from 'vitest'
import { resolveSiteUrl } from '@/lib/site-url'

describe('resolveSiteUrl', () => {
  it('always uses a configured public URL, ignoring the request host', () => {
    expect(resolveSiteUrl('https://veltre.com/', 'evil.example', 'https')).toBe('https://veltre.com')
  })

  it('falls back to the visited address when APP_URL is still localhost', () => {
    expect(resolveSiteUrl('http://localhost:3000', 'veltre.vercel.app', 'https')).toBe('https://veltre.vercel.app')
    expect(resolveSiteUrl('http://localhost:3000', '192.168.100.164:3000', null)).toBe('http://192.168.100.164:3000')
  })

  it('keeps localhost when there is no usable host', () => {
    expect(resolveSiteUrl('http://localhost:3000', null, null)).toBe('http://localhost:3000')
    expect(resolveSiteUrl('http://localhost:3000', 'bad host/<x>', 'https')).toBe('http://localhost:3000')
  })
})
