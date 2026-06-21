'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV = [
  { href: '/',                  label: '🏠 Dashboard' },
  { href: '/rider-assignment',  label: '🛵 Rider Assignment' },
  { href: '/revenue',           label: '📊 Revenue' },
  { href: '/place-order',       label: '🛒 Place Order' },
  { href: '/live-tracking',     label: '📍 Live Tracking' },
  { href: '/cancellation',      label: '⚡ Cancellation' },
  { href: '/eta-predictor',     label: '🤖 AI ETA' },
  { href: '/surge-pricing',     label: '💰 Surge Pricing' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 min-h-screen p-4">
      <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">
        Food Delivery
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
