// Payment method registry + admin-controlled enable/disable.
//
// DESIGN
//   - The catalog of all supported payment methods lives in code
//     (`ALL_PAYMENT_METHODS` below). Adding a new method = adding an entry
//     here + wiring its handler in place-order.
//   - Which methods are ENABLED for customers at checkout is stored in the
//     Setting table (key = 'payment:enabled'). Default = only bKash.
//   - The owner can toggle methods from /admin/payment-methods without
//     touching code.
//
// WHY NOT A Prisma model
//   A full PaymentMethod model (with relations to Payment) would be cleaner
//   but requires a migration. The Setting key-value store is already in the
//   schema and is the right place for "store config" data like this.

import { db } from '@/lib/db'
import { cached, cacheKey } from '@/lib/cache'
import { tag, TTL as CACHE_TTL } from '@/lib/cache-tags'
import { siteConfig } from '@/config/site'

export type PaymentMethodType = 'manual' | 'online' | 'deferred'

export type PaymentMethodDef = {
  id: string
  label: string
  desc: string
  type: PaymentMethodType
  // For manual methods: where the customer sends money (shown at checkout).
  receiver?: {
    label: string
    value: string
    // Hint shown under the receiver — e.g. "Send as 'Send Money', not 'Cash Out'"
    hint?: string
  }
  defaultEnabled: boolean
}

// Single source of truth for every payment method the system knows about.
// To add a new method, append here and handle its `provider` in
// src/app/api/checkout/place-order/route.ts.
export const ALL_PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: 'pay-on-contact',
    label: 'Pay After We Contact You',
    desc: 'Place your order now. Our team will contact you shortly to arrange payment. Your order is confirmed once payment is received.',
    type: 'deferred',
    defaultEnabled: true,
  },
  {
    id: 'manual-bkash',
    label: 'bKash (Personal)',
    desc: 'Send Money to our bKash number, enter your sender number + Transaction ID. We verify and confirm your order.',
    type: 'manual',
    receiver: {
      label: 'Send Money to this bKash number',
      value: siteConfig.payments.bkashPersonalNumber,
      hint: "Use 'Send Money' (not 'Cash Out' or 'Make Payment'). Take a screenshot after sending — you'll need the Transaction ID.",
    },
    defaultEnabled: false,
  },
  {
    id: 'manual-bank',
    label: 'Bank Deposit',
    desc: 'Transfer to our bank account and enter the deposit reference. We verify and confirm.',
    type: 'manual',
    receiver: {
      label: 'Bank Account',
      value: `${siteConfig.payments.bankAccount.name}\n${siteConfig.payments.bankAccount.bank}, ${siteConfig.payments.bankAccount.branch}\nA/C: ${siteConfig.payments.bankAccount.account}\nSWIFT: ${siteConfig.payments.bankAccount.swift}`,
      hint: 'Use any bank branch or online transfer. Keep the deposit slip reference number.',
    },
    defaultEnabled: false,
  },
  {
    id: 'manual-western-union',
    label: 'Western Union',
    desc: 'Send via Western Union and enter the MTCN tracking number.',
    type: 'manual',
    receiver: {
      label: 'Beneficiary',
      value: `${siteConfig.payments.westernUnion.beneficiaryName}\n${siteConfig.payments.westernUnion.city}, ${siteConfig.payments.westernUnion.country}`,
      hint: 'Take the MTCN (Money Transfer Control Number) from the receipt.',
    },
    defaultEnabled: false,
  },
  {
    id: 'sslcommerz',
    label: 'Online Card (SSLCommerz)',
    desc: 'Pay instantly with Visa/MasterCard via SSLCommerz. Currently simulated — will be enabled when integration is live.',
    type: 'online',
    defaultEnabled: false,
  },
]

// Setting key where the enabled-methods list is persisted as a JSON array.
// The ':v2' suffix is a schema-version bump — when we changed the default
// from 'manual-bkash' to 'pay-on-contact', old deployments had the v1 key
// stored with ['manual-bkash']. Bumping to v2 makes those stale entries
// invisible and lets the new DEFAULT_ENABLED kick in.
const SETTING_KEY = 'payment:enabled:v2'

// Default enabled set — used when no Setting row exists yet (fresh install).
// Per the product owner's current direction: customers place the order first,
// admin contacts them to arrange payment. bKash/bank/etc. stay in code but
// disabled at checkout — admin can flip them on later from /admin/payment-methods.
const DEFAULT_ENABLED = ['pay-on-contact']

/** All methods with their current `enabled` flag (from Setting table). */
export type PaymentMethodStatus = PaymentMethodDef & { enabled: boolean }

/**
 * Get ALL methods with their current enabled status.
 * Used by the admin payment-methods page.
 * Cached under the `payment-methods` tag for 10 min; busted on PATCH.
 */
export async function getAllPaymentMethodStatuses(): Promise<PaymentMethodStatus[]> {
  const key = cacheKey('payment-methods:all')
  return cached(key, [tag.paymentMethods()], CACHE_TTL.ADMIN_PRODUCTS, async () => {
    const enabledIds = await readEnabledIds()
    return ALL_PAYMENT_METHODS.map((m) => ({ ...m, enabled: enabledIds.includes(m.id) }))
  })
}

/**
 * Get only ENABLED methods (for the public checkout page).
 * Public API route /api/payment-methods calls this.
 */
export async function getEnabledPaymentMethods(): Promise<PaymentMethodDef[]> {
  const all = await getAllPaymentMethodStatuses()
  return all.filter((m) => m.enabled).map(({ enabled: _enabled, ...rest }) => rest)
}

/**
 * Set the enabled-methods list (admin action).
 * Replaces the previous list entirely.
 */
export async function setEnabledPaymentMethods(ids: string[]): Promise<void> {
  // Validate: only known method IDs, de-duped.
  const known = new Set(ALL_PAYMENT_METHODS.map((m) => m.id))
  const valid = Array.from(new Set(ids.filter((id) => known.has(id))))

  await db.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: JSON.stringify(valid) },
    update: { value: JSON.stringify(valid) },
  })

  // Bust cache so the next read picks up the change.
  const { invalidateTags } = await import('@/lib/cache')
  invalidateTags(tag.paymentMethods())
}

/** Read the enabled-method IDs from Setting (or fall back to defaults). */
async function readEnabledIds(): Promise<string[]> {
  try {
    const row = await db.setting.findUnique({ where: { key: SETTING_KEY } })
    if (!row) return DEFAULT_ENABLED
    const parsed = JSON.parse(row.value)
    if (!Array.isArray(parsed)) return DEFAULT_ENABLED
    const known = new Set(ALL_PAYMENT_METHODS.map((m) => m.id))
    const valid = parsed.filter((id) => typeof id === 'string' && known.has(id))
    return valid.length > 0 ? valid : DEFAULT_ENABLED
  } catch {
    return DEFAULT_ENABLED
  }
}

/** Find a method definition by ID. */
export function findPaymentMethod(id: string): PaymentMethodDef | undefined {
  return ALL_PAYMENT_METHODS.find((m) => m.id === id)
}
