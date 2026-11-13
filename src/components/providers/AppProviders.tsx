'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { addItem as addCartItem, cartKey, mergeCarts, normalizeCart, removeItem as removeCartItem, setItemQuantity } from '@/lib/cart'
import { api } from '@/lib/client/api'
import type { CartItem, CartQuote, StoreSettings, User } from '@/lib/types'
import { ToastProvider } from '@/components/ui/Toaster'

const SettingsContext = createContext<StoreSettings | null>(null)

interface SessionValue {
  user: User | null
  setUser: (u: User | null) => void
  logout: () => Promise<void>
}
const SessionContext = createContext<SessionValue | null>(null)

interface CartValue {
  items: CartItem[]
  quote: CartQuote | null
  quoting: boolean
  ready: boolean
  add: (item: CartItem, max: number) => { added: number; capped: boolean }
  update: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
  refresh: () => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}
const CartContext = createContext<CartValue | null>(null)

const STORAGE_KEY = 'veltre:cart:v2'

function readLocal(): CartItem[] {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

function writeLocal(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    return
  }
}

function CartProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [quote, setQuote] = useState<CartQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const itemsRef = useRef<CartItem[]>([])
  const syncedUser = useRef<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const commit = useCallback((next: CartItem[]) => {
    itemsRef.current = next
    setItems(next)
  }, [])

  useEffect(() => {
    commit(readLocal())
    setReady(true)
  }, [commit])

  useEffect(() => {
    if (!ready) return
    if (!user) {
      if (syncedUser.current) commit([])
      syncedUser.current = null
      return
    }
    if (syncedUser.current === user.id) return
    syncedUser.current = user.id
    api<{ items: CartItem[] }>('/api/cart')
      .then(({ items: server }) => {
        const merged = mergeCarts(server, itemsRef.current)
        commit(merged)
        return api('/api/cart', { method: 'PUT', body: { items: merged } })
      })
      .catch(() => {})
  }, [user, ready, commit])

  useEffect(() => {
    if (!ready) return
    writeLocal(items)
    if (user && syncedUser.current === user.id) {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        api('/api/cart', { method: 'PUT', body: { items: itemsRef.current } }).catch(() => {})
      }, 600)
    }
  }, [items, ready, user])

  useEffect(() => {
    if (!ready) return
    if (items.length === 0) {
      setQuote({ lines: [], itemCount: 0, subtotal: 0, deliveryFee: null, total: 0 })
      return
    }
    const controller = new AbortController()
    setQuoting(true)
    const t = setTimeout(() => {
      api<CartQuote>('/api/cart/quote', { body: { items }, signal: controller.signal })
        .then((q) => {
          setQuote(q)
          setQuoting(false)
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setQuoting(false)
        })
    }, 150)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [items, ready, version])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) commit(readLocal())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [commit])

  const add = useCallback<CartValue['add']>(
    (item, max) => {
      const existing = itemsRef.current.find((i) => cartKey(i) === cartKey(item))?.quantity ?? 0
      const allowed = Math.max(0, Math.min(item.quantity, max - existing))
      if (allowed > 0) commit(addCartItem(itemsRef.current, { ...item, quantity: allowed }))
      return { added: allowed, capped: allowed < item.quantity }
    },
    [commit],
  )

  const value = useMemo<CartValue>(
    () => ({
      items,
      quote,
      quoting,
      ready,
      add,
      update: (key, q) => commit(setItemQuantity(itemsRef.current, key, q)),
      remove: (key) => commit(removeCartItem(itemsRef.current, key)),
      clear: () => commit([]),
      refresh: () => setVersion((v) => v + 1),
      drawerOpen,
      setDrawerOpen,
    }),
    [items, quote, quoting, ready, add, commit, drawerOpen],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function AppProviders({ children, settings, user: initialUser }: { children: ReactNode; settings: StoreSettings; user: User | null }) {
  const [user, setUser] = useState(initialUser)

  useEffect(() => setUser(initialUser), [initialUser])

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    writeLocal([])
    window.location.assign('/')
  }, [])

  const session = useMemo(() => ({ user, setUser, logout }), [user, logout])

  return (
    <SettingsContext.Provider value={settings}>
      <SessionContext.Provider value={session}>
        <ToastProvider>
          <CartProvider user={user}>{children}</CartProvider>
        </ToastProvider>
      </SessionContext.Provider>
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <AppProviders>')
  return ctx
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <AppProviders>')
  return ctx
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <AppProviders>')
  return ctx
}
