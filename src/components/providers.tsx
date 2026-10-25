'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { loadMessages, translate, defaultLocale, type Locale } from '@/lib/i18n'

/* ---------------- Locale ---------------- */

type LocaleCtx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (path: string, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleCtx | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )ub_locale=([^;]+)/)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (m && (m[1] === 'en' || m[1] === 'bn')) setLocaleState(m[1] as Locale)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    document.cookie = `ub_locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}`
    document.documentElement.lang = l
  }, [])

  const t = useCallback(
    (path: string, params?: Record<string, string | number>) =>
      translate(loadMessages(locale) as unknown as Record<string, unknown>, path, params),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

export function useT() {
  return useLocale().t
}

/* ---------------- Currency ---------------- */

export type CurrencyInfo = {
  code: string
  symbol: string
  name: string
  rateFromBdt: number
}

type CurrencyCtx = {
  currency: CurrencyInfo | null
  currencies: CurrencyInfo[]
  setCurrency: (code: string) => void
  loading: boolean
}

const CurrencyContext = createContext<CurrencyCtx | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([])
  const [currency, setCurrencyState] = useState<CurrencyInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/currency/rates')
      const data = await res.json()
      setCurrencies(data.currencies)
      const m = document.cookie.match(/(?:^|; )ub_currency=([^;]+)/)
      const code = m?.[1] || 'USD'
      const found = data.currencies.find((c: CurrencyInfo) => c.code === code) || data.currencies[0]
      setCurrencyState(found)
    } catch {
      setCurrencyState({ code: 'USD', symbol: '$', name: 'US Dollar', rateFromBdt: 0.0091 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setCurrency = useCallback((code: string) => {
    document.cookie = `ub_currency=${code}; path=/; max-age=${60 * 60 * 24 * 365}`
    load()
  }, [load])

  const value = useMemo(
    () => ({ currency, currencies, setCurrency, loading }),
    [currency, currencies, setCurrency, loading],
  )
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}

/* ---------------- Cart (Zustand-like via context + localStorage) ---------------- */

export type CartLine = {
  productId: number
  slug: string
  name: string
  image: string
  priceBdt: number
  variantId?: number
  variantLabel?: string
  qty: number
  cakeMessage?: string
}

type CartState = {
  items: CartLine[]
  couponCode?: string
  addItem: (line: CartLine) => void
  updateQty: (productId: number, variantId: number | undefined, qty: number) => void
  removeItem: (productId: number, variantId: number | undefined) => void
  clear: () => void
  setCoupon: (code?: string) => void
  count: () => number
}

const CartContext = createContext<CartState | null>(null)

const CART_KEY = 'ub_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [couponCode, setCouponCode] = useState<string | undefined>(undefined)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(parsed.items || [])
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCouponCode(parsed.couponCode)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify({ items, couponCode }))
    // Notify header to update count
    window.dispatchEvent(new Event('ub-cart-change'))
  }, [items, couponCode])

  const addItem = useCallback((line: CartLine) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === line.productId && i.variantId === line.variantId,
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + line.qty }
        return next
      }
      return [...prev, line]
    })
  }, [])

  const updateQty = useCallback(
    (productId: number, variantId: number | undefined, qty: number) => {
      setItems((prev) =>
        prev
          .map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, qty: Math.max(1, qty) }
              : i,
          )
          .filter((i) => i.qty > 0),
      )
    },
    [],
  )

  const removeItem = useCallback((productId: number, variantId: number | undefined) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)))
  }, [])

  const clear = useCallback(() => {
    setItems([])
    setCouponCode(undefined)
  }, [])

  const setCoupon = useCallback((code?: string) => setCouponCode(code), [])

  const count = useCallback(() => items.reduce((s, i) => s + i.qty, 0), [items])

  const value = useMemo(
    () => ({ items, couponCode, addItem, updateQty, removeItem, clear, setCoupon, count }),
    [items, couponCode, addItem, updateQty, removeItem, clear, setCoupon, count],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
