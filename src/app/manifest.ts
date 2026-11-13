import type { MetadataRoute } from 'next'
import { getSettings } from '@/server/repos/settings'

export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings()
  return {
    name: s.brandName,
    short_name: s.brandName,
    description: s.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#050504',
    theme_color: '#f4f2ee',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Shop', url: '/shop' },
      { name: 'My orders', url: '/account/orders' },
    ],
  }
}
