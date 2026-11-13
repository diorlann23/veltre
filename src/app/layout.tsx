import type { Metadata, Viewport } from 'next'
import { Cinzel, Inter, Inter_Tight } from 'next/font/google'
import type { ReactNode } from 'react'
import { AppProviders } from '@/components/providers/AppProviders'
import { LaunchSplash, launchSplashScript } from '@/components/pwa/LaunchSplash'
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister'
import { getCurrentUser } from '@/server/auth'
import { siteUrl } from '@/server/env'
import { getSettings } from '@/server/repos/settings'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight', display: 'swap' })
const cinzel = Cinzel({ subsets: ['latin'], weight: '500', variable: '--font-splash', display: 'swap' })

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  const title = `${s.brandName} — Premium Joggers & Streetwear`
  return {
    metadataBase: new URL(await siteUrl()),
    title: { default: title, template: `%s | ${s.brandName}` },
    description: s.description,
    applicationName: s.brandName,
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: s.brandName, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
    icons: {
      icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      apple: '/icons/apple-touch-icon.png',
    },
    openGraph: { type: 'website', siteName: s.brandName, title, description: s.description, images: s.heroImage ? [s.heroImage] : undefined },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: '#f4f2ee',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()])
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${cinzel.variable}`}>
      <body>
        <LaunchSplash brand={settings.brandName} tagline={settings.tagline} />
        <script dangerouslySetInnerHTML={{ __html: launchSplashScript }} />
        <AppProviders settings={settings} user={user}>
          {children}
        </AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
