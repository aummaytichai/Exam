'use client'
import { useState, useEffect } from 'react'

interface CancellationLog {
  id: string
  riderId: string
  rider: { name: string }
  cancelReason: string | null
  fraudScore: number
  flaggedForReview: boolean
  hadActiveIncentive: boolean
  consecutiveCancelsToday: number
  cancelledAt: string
}

interface ZoneIncentive {
  id: string
  zoneId: string
  bonusMultiplier: number
  expiresAt: string
  triggerReason: string
}

interface ZoneStat {
  zoneId: string
  count: number
  flagged: number
}

export default function CancellationPage() {
  const [logs, setLogs] = useState<CancellationLog[]>([])
  const [incentive, setIncentive] = useState<ZoneIncentive | null>(null)
  const [stats, setStats] = useState<ZoneStat[]>([])
  const [zoneId, setZoneId] = useState('zone_1')
  const [multiplier, setMultiplier] = useState(1.5)
  const [triggering, setTriggering] = useState(false)

  const load = async () => {
    const res = await fetch('/api/cancellation')
    const data = await res.json()
    setLogs(data.logs)
    setIncentive(data.incentive)
    setStats(data.stats)
  }

  useEffect(() => { load() }, [])

  const triggerIncentive = async () => {
    setTriggering(true)
    await fetch('/api/cancellation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId, bonusMultiplier: multiplier }),
    })
    await load()
    setTriggering(false)
  }

  const fraudLogs = logs.filter((l) => l.flaggedForReview)

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">⚡ Cancellation & Incentive</h1>
      <p className="text-gray-400 text-sm mb-6">ข้อ 5 — Rush Hour Zone Incentive + Fraud Detection</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">📊 Zone Stats</h3>
          <div className="space-y-2">
            {stats.map((s) => (
              <div key={s.zoneId} className="flex justify-between text-xs">
                <span className="text-gray-400">{s.zoneId}</span>
                <div className="flex gap-3">
                  <span>{s.count} cancels</span>
                  {s.flagged > 0 && <span className="text-red-400">{s.flagged} flagged</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">🎯 Active Incentive</h3>
          {incentive ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Zone</span>
                <span>{incentive.zoneId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Multiplier</span>
                <span className="text-green-400">{incentive.bonusMultiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expires</span>
                <span className="text-xs">{new Date(incentive.expiresAt).toLocaleTimeString('th-TH')}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">{incentive.triggerReason}</div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">ไม่มี incentive active</p>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">🚀 Trigger Incentive</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Zone ID</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              >
                {['zone_1', 'zone_2', 'zone_3', 'zone_4', 'zone_5'].map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Multiplier: {multiplier}x</label>
              <input
                type="range" min={1.1} max={2.0} step={0.1}
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>
            <button
              onClick={triggerIncentive}
              disabled={triggering}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
            >
              {triggering ? 'กำลัง trigger...' : '⚡ Trigger Bonus'}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          🚨 Fraud Detection
          {fraudLogs.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              {fraudLogs.length} flagged
            </span>
          )}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="pb-2 pr-3">Rider</th>
                <th className="pb-2 pr-3">Fraud Score</th>
                <th className="pb-2 pr-3">Consecutive</th>
                <th className="pb-2 pr-3">Had Incentive</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className={`border-b border-gray-800/50 ${log.flaggedForReview ? 'bg-red-500/5' : ''}`}>
                  <td className="py-2 pr-3">{log.rider.name}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${log.fraudScore > 60 ? 'bg-red-500' : log.fraudScore > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${log.fraudScore}%` }}
                        />
                      </div>
                      <span>{log.fraudScore.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3">{log.consecutiveCancelsToday}x</td>
                  <td className="py-2 pr-3">
                    {log.hadActiveIncentive
                      ? <span className="text-yellow-400">⚡ Yes</span>
                      : <span className="text-gray-600">No</span>
                    }
                  </td>
                  <td className="py-2 pr-3">
                    {log.flaggedForReview
                      ? <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">FLAGGED</span>
                      : <span className="text-gray-600">OK</span>
                    }
                  </td>
                  <td className="py-2 text-gray-500">
                    {new Date(log.cancelledAt).toLocaleTimeString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
