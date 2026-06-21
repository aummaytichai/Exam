'use client'
import { useState } from 'react'
import type { ETAResult, WeatherCondition } from '@/lib/etaPredictor'

const WEATHER_OPTIONS: { value: WeatherCondition; label: string }[] = [
  { value: 'clear', label: '☀️ แดดจ้า' },
  { value: 'light_rain', label: '🌦️ ฝนปรอย' },
  { value: 'heavy_rain', label: '⛈️ ฝนหนัก' },
]

export default function ETAPredictorPage() {
  const [distanceKm, setDistanceKm] = useState(5)
  const [weather, setWeather] = useState<WeatherCondition>('clear')
  const [prepTimeMin, setPrepTimeMin] = useState(10)
  const [timeOfDay, setTimeOfDay] = useState('normal')
  const [trafficLevel, setTrafficLevel] = useState<'heavy' | 'moderate' | 'light'>('moderate')
  const [result, setResult] = useState<ETAResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePredict = async () => {
    setLoading(true)
    const res = await fetch('/api/eta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceKm, weather, prepTimeMin, timeOfDay, trafficLevel }),
    })
    setResult(await res.json())
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">🤖 AI ETA Predictor</h1>
      <p className="text-gray-400 text-sm mb-6">ข้อ 6 — Mock AI + Physical Guardrail Override</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
          <h3 className="font-medium text-sm">Input Parameters</h3>

          <div>
            <label className="text-xs text-gray-400 block mb-1">ระยะทาง: {distanceKm} km</label>
            <input type="range" min={0.5} max={20} step={0.5}
              value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full accent-violet-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">สภาพอากาศ</label>
            <div className="flex gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button key={w.value} onClick={() => setWeather(w.value)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${weather === w.value ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">เวลาเตรียมอาหาร: {prepTimeMin} นาที</label>
            <input type="range" min={3} max={30} step={1}
              value={prepTimeMin} onChange={(e) => setPrepTimeMin(Number(e.target.value))}
              className="w-full accent-violet-500" />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">ช่วงเวลา</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)}>
              <option value="normal">ปกติ</option>
              <option value="rush_morning">Rush hour เช้า (7-9น.)</option>
              <option value="rush_evening">Rush hour เย็น (17-19น.)</option>
              <option value="late_night">ดึก (&gt;22น.)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2">การจราจร</label>
            <div className="flex gap-2">
              {(['light', 'moderate', 'heavy'] as const).map((t) => (
                <button key={t} onClick={() => setTrafficLevel(t)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${trafficLevel === t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {t === 'light' ? 'โล่ง' : t === 'moderate' ? 'ปกติ' : 'ติด'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handlePredict} disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {loading ? 'กำลังคำนวณ...' : '🤖 Predict ETA'}
          </button>
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <div className={`border rounded-xl p-5 ${result.guardrailApplied ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-gray-900 border-gray-800'}`}>
                <div className="text-4xl font-bold mb-1">{result.etaMinutes} <span className="text-xl font-normal text-gray-400">นาที</span></div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${result.confidence === 'high' ? 'bg-green-500/20 text-green-400' : result.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {result.confidence} confidence
                  </span>
                  <span className="text-xs text-gray-500">{result.source}</span>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium mb-3">Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">เตรียมอาหาร</span>
                    <span>{result.breakdown.prepMin} นาที</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">เดินทาง</span>
                    <span>{result.breakdown.travelMin} นาที</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Buffer</span>
                    <span>{result.breakdown.bufferMin} นาที</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2 font-medium">
                    <span>รวม</span>
                    <span>{result.etaMinutes} นาที</span>
                  </div>
                </div>
              </div>

              {result.guardrailApplied && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-yellow-400 mb-1">⚠️ Guardrail Applied</h3>
                  <p className="text-xs text-yellow-300/80">{result.guardrailReason}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-gray-500 text-sm">กดปุ่ม Predict ETA เพื่อดูผล</p>
              <p className="text-gray-600 text-xs mt-1">AI mock + Physical guardrail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
