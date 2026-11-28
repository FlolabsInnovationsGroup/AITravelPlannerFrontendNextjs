import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site'

export const shareImageSize = { width: 1200, height: 630 }

export async function renderShareImage() {
  const logo = await readFile(join(process.cwd(), 'public', 'logo.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '80px',
          background: '#1c1917',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 260,
            height: 340,
            borderRadius: 32,
            background: '#ffffff',
            marginRight: 64,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={176} height={255} alt="" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 44, color: '#fbbf24', marginTop: 20 }}>{SITE_TAGLINE}</div>
          <div style={{ fontSize: 30, color: '#d6d3d1', marginTop: 28 }}>AI-powered travel planning</div>
        </div>
      </div>
    ),
    shareImageSize,
  )
}
