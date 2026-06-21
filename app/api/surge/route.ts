import { NextResponse } from 'next/server'
import { computeSurge, type SurgeInput } from '@/lib/surgePricing'

export async function POST(req: Request) {
  const body = await req.json() as SurgeInput
  const result = computeSurge(body)
  return NextResponse.json(result)
}
