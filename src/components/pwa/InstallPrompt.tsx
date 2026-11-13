'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog, Tabs } from 'radix-ui'
import {
  Check,
  Compass,
  Download,
  Ellipsis,
  EllipsisVertical,
  Menu,
  Monitor,
  MonitorDown,
  Plus,
  Share,
  Smartphone,
  SquarePlus,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useSettings } from '@/components/providers/AppProviders'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toaster'
import { defaultBrowser, detectInstallEnv, type InstallBrowser, type InstallEnv, type InstallOS } from '@/lib/install-platform'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface Step {
  title: string
  detail: string
  cue?: { icon: LucideIcon; label: string }
}

interface Guide {
  steps: Step[]
  note?: string
}

const PREF_KEY = 'veltre:install:v1'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000
const AUTO_OPEN_DELAY_MS = 4000
const OPEN_EVENT = 'veltre:install-guide'
const QUIET_PATHS = /^\/(cart|checkout)(\/|$)/

interface InstallPref {
  dismissedAt?: number
  never?: boolean
  installed?: boolean
}

function readPref(): InstallPref {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') as InstallPref
  } catch {
    return {}
  }
}

function writePref(patch: InstallPref) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...readPref(), ...patch }))
  } catch {
    return
  }
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Opens the install guide from anywhere, e.g. a "Get the app" link. */
export function openInstallGuide() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

const tabs: { os: InstallOS; label: string; icon: LucideIcon }[] = [
  { os: 'ios', label: 'iPhone & iPad', icon: Smartphone },
  { os: 'android', label: 'Android', icon: Smartphone },
  { os: 'desktop', label: 'Computer', icon: Monitor },
]

const iosShareStep: Record<string, Step> = {
  safari: {
    title: 'Tap the Share button',
    detail: 'It’s in the toolbar at the bottom of Safari (top-right on iPad). On iOS 26, tap ••• first, then Share.',
    cue: { icon: Share, label: 'Share' },
  },
  chrome: {
    title: 'Tap the Share button',
    detail: 'It’s at the right end of the address bar at the top of Chrome.',
    cue: { icon: Share, label: 'Share' },
  },
  edge: {
    title: 'Open the menu, then tap Share',
    detail: 'Tap ••• at the bottom of Edge, then choose Share.',
    cue: { icon: Ellipsis, label: 'Menu' },
  },
  firefox: {
    title: 'Open the menu, then tap Share',
    detail: 'Tap the ☰ menu at the bottom-right of Firefox, then choose Share.',
    cue: { icon: Menu, label: 'Menu' },
  },
}

function iosGuide(browser: InstallBrowser, brand: string): Guide {
  const steps: Step[] = [
    iosShareStep[browser] ?? iosShareStep.safari,
    {
      title: 'Choose “Add to Home Screen”',
      detail: 'Scroll down the list of actions. If you don’t see it, tap “View More” or “Edit Actions”.',
      cue: { icon: SquarePlus, label: 'Add to Home Screen' },
    },
    {
      title: 'Tap “Add”',
      detail: `Leave “Open as Web App” switched on, then tap Add in the top-right corner. ${brand} now sits on your home screen.`,
      cue: { icon: Plus, label: 'Add' },
    },
  ]
  if (browser === 'safari') return { steps }
  return { steps, note: 'Installing from Chrome, Edge or Firefox needs iOS 16.4 or later. On older iPhones, open this page in Safari.' }
}

function androidGuide(browser: InstallBrowser, brand: string): Guide {
  const done = `${brand} will appear on your home screen and in your app drawer.`
  switch (browser) {
    case 'samsung':
      return {
        steps: [
          { title: 'Open the menu', detail: 'Tap ☰ in the bottom-right corner of Samsung Internet.', cue: { icon: Menu, label: 'Menu' } },
          { title: 'Tap “Add page to”', detail: 'You may need to swipe the menu up to find it.', cue: { icon: SquarePlus, label: 'Add page to' } },
          { title: 'Choose “Home screen”', detail: `Then tap Add. ${done}`, cue: { icon: Plus, label: 'Home screen' } },
        ],
      }
    case 'firefox':
      return {
        steps: [
          { title: 'Open the menu', detail: 'Tap ⋮ next to the address bar.', cue: { icon: EllipsisVertical, label: 'Menu' } },
          { title: 'Tap “Add to Home screen”', detail: 'On some versions it’s called “Install”.', cue: { icon: SquarePlus, label: 'Add to Home screen' } },
          { title: 'Confirm', detail: `Tap Add. ${done}`, cue: { icon: Plus, label: 'Add' } },
        ],
      }
    case 'edge':
      return {
        steps: [
          { title: 'Open the menu', detail: 'Tap ••• at the bottom of Edge.', cue: { icon: Ellipsis, label: 'Menu' } },
          { title: 'Tap “Add to phone”', detail: 'Swipe the menu left if you don’t see it straight away.', cue: { icon: Download, label: 'Add to phone' } },
          { title: 'Tap “Install”', detail: done, cue: { icon: Check, label: 'Install' } },
        ],
      }
    default:
      return {
        steps: [
          { title: 'Open the browser menu', detail: 'Tap ⋮ in the top-right corner of Chrome.', cue: { icon: EllipsisVertical, label: 'Menu' } },
          { title: 'Tap “Add to Home screen”', detail: 'On many phones this says “Install app” instead.', cue: { icon: Download, label: 'Install app' } },
          { title: 'Tap “Install”', detail: done, cue: { icon: Check, label: 'Install' } },
        ],
      }
  }
}

function desktopGuide(browser: InstallBrowser, brand: string): Guide {
  const launch: Step = {
    title: 'Open it anytime',
    detail: `${brand} opens in its own window. Find it in your Start menu, Dock, Launchpad or app list, and pin it for one-click access.`,
  }
  switch (browser) {
    case 'safari':
      return {
        steps: [
          { title: 'Open the File menu', detail: 'It’s in the menu bar at the top of your screen. You can also use the Share button in the Safari toolbar.', cue: { icon: Share, label: 'File' } },
          { title: 'Choose “Add to Dock”', detail: 'You can rename the app before adding it if you like.', cue: { icon: SquarePlus, label: 'Add to Dock' } },
          { title: 'Click “Add”', detail: `${brand} appears in your Dock and Launchpad.`, cue: { icon: Plus, label: 'Add' } },
        ],
        note: 'Add to Dock needs macOS Sonoma (14) or later.',
      }
    case 'edge':
      return {
        steps: [
          { title: 'Click the “App available” icon', detail: 'It’s at the right end of the address bar. No icon? Open the ••• menu, then Apps → Install this site as an app.', cue: { icon: MonitorDown, label: 'App available' } },
          { title: 'Click “Install”', detail: 'Confirm in the small window that pops up.', cue: { icon: Check, label: 'Install' } },
          launch,
        ],
      }
    case 'chrome':
    case 'opera':
      return {
        steps: [
          { title: 'Click the install icon in the address bar', detail: 'It’s at the right end of the address bar. No icon? Open the ⋮ menu, then Cast, save and share → Install page as app.', cue: { icon: MonitorDown, label: 'Install' } },
          { title: 'Click “Install”', detail: 'Confirm in the small window that pops up.', cue: { icon: Check, label: 'Install' } },
          launch,
        ],
      }
    default:
      return {
        ...desktopGuide('chrome', brand),
        note: 'This browser can’t install websites as apps. Open this page in Google Chrome or Microsoft Edge, then follow these steps.',
      }
  }
}

function guideFor(os: InstallOS, browser: InstallBrowser, brand: string): Guide {
  if (browser === 'inapp') {
    const base = os === 'ios' ? iosGuide('safari', brand) : androidGuide('chrome', brand)
    const openInBrowser: Step = {
      title: `Open this page in ${os === 'ios' ? 'Safari' : 'Chrome'}`,
      detail: 'You’re in an in-app browser, which can’t install apps. Tap ••• or ⋮ in the corner and choose “Open in browser”.',
      cue: { icon: Compass, label: 'Open in browser' },
    }
    return { steps: [openInBrowser, ...base.steps] }
  }
  if (os === 'ios') return iosGuide(browser, brand)
  if (os === 'android') return androidGuide(browser, brand)
  return desktopGuide(browser, brand)
}

const perks = ['Opens full-screen, just like an app', 'Loads faster and works offline', 'Free, with no app store or download']

export function InstallPrompt() {
  const { brandName } = useSettings()
  const pathname = usePathname()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [env, setEnv] = useState<InstallEnv>({ os: 'desktop', browser: 'chrome' })
  const [tab, setTab] = useState<InstallOS>('desktop')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const quiet = QUIET_PATHS.test(pathname)

  useEffect(() => {
    const detected = detectInstallEnv(navigator.userAgent, navigator.maxTouchPoints)
    setEnv(detected)
    setTab(detected.os)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      writePref({ installed: true })
      setDeferred(null)
      setOpen(false)
      toast({ title: `${brandName} is installed`, description: 'Open it from your home screen or app list anytime.' })
    }
    const onOpen = () => {
      setTab(detected.os)
      setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [brandName, toast])

  useEffect(() => {
    if (quiet || isStandalone()) return
    const pref = readPref()
    if (pref.installed || pref.never || (pref.dismissedAt && Date.now() - pref.dismissedAt < SNOOZE_MS)) return
    const t = setTimeout(() => setOpen(true), AUTO_OPEN_DELAY_MS)
    return () => clearTimeout(t)
  }, [quiet])

  const onOpenChange = useCallback((next: boolean) => {
    if (!next) writePref({ dismissedAt: Date.now() })
    setOpen(next)
  }, [])

  const neverAsk = () => {
    writePref({ never: true })
    setOpen(false)
  }

  const installNow = async () => {
    if (!deferred) return
    setInstalling(true)
    try {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') {
        writePref({ installed: true })
        setOpen(false)
      }
    } catch {
      return
    } finally {
      // The browser only lets each prompt event be used once.
      setDeferred(null)
      setInstalling(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]" />
        <Dialog.Content
          ref={contentRef}
          onOpenAutoFocus={(e) => {
            // Opens unprompted, so focus the sheet itself rather than ringing the close button.
            e.preventDefault()
            contentRef.current?.focus()
          }}
          className="install-sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-paper shadow-2xl focus:outline-none sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="overflow-y-auto overscroll-contain px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-8 sm:pb-8">
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-sand sm:hidden" />

            <div className="flex items-start gap-4">
              <img src="/icons/icon-192.png" alt="" width={56} height={56} className="size-14 shrink-0 rounded-2xl shadow-md" />
              <div className="min-w-0 flex-1 pt-0.5">
                <Dialog.Title className="font-display text-xl font-semibold tracking-tight">Get the {brandName} app</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-relaxed text-mute">
                  {tab === 'desktop' ? 'Install it on your computer for quick access from your dock or taskbar.' : 'Add it to your home screen for faster, one-tap shopping.'}
                </Dialog.Description>
              </div>
              <Dialog.Close className="-mt-1 -mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-mute hover:bg-ink/5 hover:text-ink" aria-label="Close">
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>

            <ul className="mt-5 space-y-1.5 text-sm text-ink/80">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-success" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>

            <Tabs.Root value={tab} onValueChange={(v) => setTab(v as InstallOS)} className="mt-6">
              <Tabs.List aria-label="Choose your device" className="grid grid-cols-3 gap-1 rounded-full bg-bone p-1">
                {tabs.map((t) => (
                  <Tabs.Trigger
                    key={t.os}
                    value={t.os}
                    className="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium text-mute transition data-[state=active]:bg-paper data-[state=active]:text-ink data-[state=active]:shadow-sm"
                  >
                    <t.icon className="size-4 shrink-0 max-sm:hidden" aria-hidden="true" />
                    <span className="truncate">{t.label}</span>
                    {t.os === env.os && <span className="sr-only"> (this device)</span>}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              {tabs.map((t) => {
                const mine = t.os === env.os
                const guide = guideFor(t.os, mine ? env.browser : defaultBrowser[t.os], brandName)
                return (
                  <Tabs.Content key={t.os} value={t.os} className="mt-5 focus:outline-none">
                    {mine && deferred && (
                      <div className="mb-5">
                        <Button size="lg" fullWidth loading={installing} onClick={installNow}>
                          {!installing && <Download className="size-4" aria-hidden="true" />} Install {brandName}
                        </Button>
                        <p className="mt-4 flex items-center gap-3 text-xs text-mute before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
                          or install it yourself
                        </p>
                      </div>
                    )}
                    {guide.note && <p className="mb-4 rounded-xl border border-accent-soft/60 bg-accent-soft/15 px-4 py-3 text-sm leading-relaxed text-ink/85">{guide.note}</p>}
                    <ol className="space-y-4">
                      {guide.steps.map((step, i) => (
                        <li key={step.title} className="flex gap-3.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-paper" aria-hidden="true">
                            {i + 1}
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className="font-medium leading-snug">
                              <span className="sr-only">Step {i + 1}: </span>
                              {step.title}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-mute">{step.detail}</p>
                            {step.cue && (
                              <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink">
                                <step.cue.icon className="size-4" aria-hidden="true" />
                                {step.cue.label}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </Tabs.Content>
                )
              })}
            </Tabs.Root>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" size="sm" onClick={neverAsk} className="text-mute">
                Don’t show this again
              </Button>
              <Dialog.Close asChild>
                <Button variant="secondary">Maybe later</Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** A "Get the app" link that hides itself once the site is already running as an installed app. */
export function InstallAppLink({ className = '' }: { className?: string }) {
  const [installed, setInstalled] = useState(true)
  useEffect(() => setInstalled(isStandalone()), [])
  if (installed) return null
  return (
    <button type="button" onClick={openInstallGuide} className={className}>
      Get the app
    </button>
  )
}
