'use client'
import { useState, useEffect, useCallback } from 'react'
import { GUARDRAILS, type SurgeResult } from '@/lib/surgePricing'

export default function SurgePricingPage() {
  const [activeRiders, setActiveRiders] = useState(5)
  const [pendingOrders, setPendingOrders] = useState(20)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0)
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(40)
  const [result, setResult] = useState<SurgeResult | null>(null)
  const [loading, setLoading] = useState(false)

  const compute = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/surge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activeRiders,
        pendingOrders,
        zoneId: 'zone_1',
        currentMultiplier,
        baseDeliveryFee,
      }),
    })
    setResult(await res.json())
    setLoading(false)
  }, [activeRiders, pendingOrders, currentMultiplier, baseDeliveryFee])

  useEffect(() => {
    const t = setTimeout(compute, 300)
    return () => clearTimeout(t)
  }, [compute])

  const surgeRatio = pendingOrders / (activeRiders || 1)

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">💰 Surge Pricing</h1>
      <p className="text-gray-400 text-sm mb-6">ข้อ 7 — Dynamic Multiplier + Hard-coded Guardrails</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
          <h3 className="font-medium text-sm">Supply & Demand</h3>

          <div>
            <label className="text-xs text-gray-400 block mb-1">🛵 Riders ที่ active: {activeRiders}</label>
            <input type="range" min={1} max={20} step={1}
              value={activeRiders} onChange={(e) => setActiveRiders(Number(e.target.value))}
              className="w-full accent-violet-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">📦 Orders รอรับ: {pendingOrders}</label>
            <input type="range" min={0} max={50} step={1}
              value={pendingOrders} onChange={(e) => setPendingOrders(Number(e.target.value))}
              className="w-full accent-violet-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">📈 Multiplier ปัจจุบัน: {currentMultiplier.toFixed(1)}x</label>
            <input type="range" min={1.0} max={2.5} step={0.1}
              value={currentMultiplier} onChange={(e) => setCurrentMultiplier(Number(e.target.value))}
              className="w-full accent-violet-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">💳 ค่าส่งพื้นฐาน: ฿{baseDeliveryFee}</label>
            <input type="range" min={20} max={100} step={5}
              value={baseDeliveryFee} onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
              className="w-full accent-violet-500" />
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">Surge Ratio = Orders ÷ Riders</div>
            <div className="text-2xl font-bold">{surgeRatio.toFixed(2)}x</div>
            <div className={`text-xs mt-1 ${surgeRatio > 3 ? 'text-red-400' : surgeRatio > 1.5 ? 'text-yellow-400' : 'text-green-400'}`}>
              {surgeRatio > 3 ? 'High demand' : surgeRatio > 1.5 ? 'Moderate demand' : 'Balanced'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {result && (
            <>
              <div className={`border rounded-xl p-5 ${result.guardrailApplied ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-gray-900 border-gray-800'}`}>
                <div className="text-xs text-gray-400 mb-1">Final Multiplier</div>
                <div className="text-4xl font-bold">{result.finalMultiplier}x</div>
                <div className="text-sm text-gray-400 mt-1">ค่าส่ง: <span className="text-white font-medium">฿{result.feeAfterSurge}</span></div>

                {result.requiresConfirmation && (
                  <div className="mt-3 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                    ⚠️ ต้องมีการยืนยันจาก Manager ก่อน deploy
                  </div>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Calculation Steps</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Surge Ratio</span>
                    <span>{result.surgeRatio.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">AI Recommended</span>
                    <span className="text-blue-400">{result.aiRecommended}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">After Guardrails</span>
                    <span className={result.guardrailApplied ? 'text-yellow-400' : 'text-green-400'}>{result.finalMultiplier}x</span>
                  </div>
                </div>
              </div>

              {result.guardrailApplied && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-yellow-400 mb-1">⚠️ Guardrail Applied</h3>
                  <p className="text-xs text-yellow-300/80">{result.guardrailReason}</p>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Hard-coded Limits</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Multiplier</span>
                    <span className="font-mono">{GUARDRAILS.MAX_MULTIPLIER}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Absolute Fee</span>
                    <span className="font-mono">฿{GUARDRAILS.MAX_ABSOLUTE_FEE}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Step Increase</span>
                    <span className="font-mono">+{GUARDRAILS.MAX_INCREASE_PER_STEP * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Requires Confirmation</span>
                    <span className="font-mono">≥{GUARDRAILS.REQUIRE_CONFIRMATION_ABOVE}x</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
