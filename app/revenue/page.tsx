'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface RevenueRow {
  category: string
  rank: number
  restaurant_name: string
  aov: number
  order_count: number
}

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7c2f']

export default function RevenuePage() {
  const [data, setData] = useState<RevenueRow[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  useEffect(() => {
    fetch('/api/revenue').then((r) => r.json()).then(setData)
  }, [])

  const categories = ['All', ...Array.from(new Set(data.map((d) => d.category)))]
  const filtered = selectedCategory === 'All' ? data : data.filter((d) => d.category === selectedCategory)

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">📊 Revenue Dashboard</h1>
      <p className="text-gray-400 text-sm mb-6">ข้อ 2 — AOV Top 3 per Category (SQL Window Function)</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === c ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filtered} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
            <XAxis
              dataKey="restaurant_name"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              formatter={(val: number) => [`฿${val.toFixed(0)}`, 'AOV']}
            />
            <Bar dataKey="aov" radius={[4, 4, 0, 0]}>
              {filtered.map((entry, i) => (
                <Cell key={i} fill={RANK_COLORS[(entry.rank - 1) % 3]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500">
          <span><span className="text-yellow-400">■</span> อันดับ 1</span>
          <span><span className="text-gray-400">■</span> อันดับ 2</span>
          <span><span className="text-orange-600">■</span> อันดับ 3</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <th className="pb-3 pr-4">อันดับ</th>
              <th className="pb-3 pr-4">ร้าน</th>
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">AOV (฿)</th>
              <th className="pb-3">Orders</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="py-2.5 pr-4">
                  <span className={`font-bold ${row.rank === 1 ? 'text-yellow-400' : row.rank === 2 ? 'text-gray-400' : 'text-orange-600'}`}>
                    #{row.rank}
                  </span>
                </td>
                <td className="py-2.5 pr-4">{row.restaurant_name}</td>
                <td className="py-2.5 pr-4">
                  <span className="bg-gray-800 px-2 py-0.5 rounded-full text-xs">{row.category}</span>
                </td>
                <td className="py-2.5 pr-4 font-mono">฿{row.aov.toFixed(0)}</td>
                <td className="py-2.5 text-gray-400">{row.order_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
