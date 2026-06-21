import { NextResponse } from 'next/server'
import { predictETA, type ETAInput } from '@/lib/etaPredictor'

export async function POST(req: Request) {
  const body = await req.json() as ETAInput
  const result = predictETA(body)
  return NextResponse.json(result)
}
