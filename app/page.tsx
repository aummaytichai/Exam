import Link from 'next/link'

const FEATURES = [
  { href: '/rider-assignment', icon: '🛵', title: 'Rider Assignment',  desc: 'Haversine + Stale Protection + Tie-breaker',      badge: 'ข้อ 1', color: 'border-green-500/30 hover:border-green-500' },
  { href: '/revenue',          icon: '📊', title: 'Revenue Dashboard', desc: 'AOV Top 3 per Category — Window Function',         badge: 'ข้อ 2', color: 'border-blue-500/30 hover:border-blue-500' },
  { href: '/place-order',      icon: '🛒', title: 'Place Order',       desc: 'Atomic Stock — SELECT FOR UPDATE + Transaction',   badge: 'ข้อ 3', color: 'border-yellow-500/30 hover:border-yellow-500' },
  { href: '/live-tracking',    icon: '📍', title: 'Live Tracking',     desc: 'Real-time WebSocket map — 2s GPS updates',         badge: 'ข้อ 4', color: 'border-purple-500/30 hover:border-purple-500' },
  { href: '/cancellation',     icon: '⚡', title: 'Cancellation',      desc: 'Rush Hour Incentive + Fraud Detection',            badge: 'ข้อ 5', color: 'border-red-500/30 hover:border-red-500' },
  { href: '/eta-predictor',    icon: '🤖', title: 'AI ETA Predictor',  desc: 'Mock AI + Physical guardrail override',            badge: 'ข้อ 6', color: 'border-cyan-500/30 hover:border-cyan-500' },
  { href: '/surge-pricing',    icon: '💰', title: 'Surge Pricing',     desc: 'Dynamic multiplier + Hard-coded guardrails',       badge: 'ข้อ 7', color: 'border-emerald-500/30 hover:border-emerald-500' },
]

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Food Delivery Platform</h1>
      <p className="text-gray-400 mb-8 text-sm">Fullstack Developer Exam — Interactive Demo</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`block bg-gray-900 border rounded-xl p-5 transition-all ${f.color}`}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-sm">{f.title}</h2>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                {f.badge}
              </span>
            </div>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
