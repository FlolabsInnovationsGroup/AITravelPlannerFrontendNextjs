import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    geoapifyApiKey: process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  })
}
