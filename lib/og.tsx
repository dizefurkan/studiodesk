import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

const INK = '#1C2114'
const LIME = '#C6F432'
const CANVAS = '#F6F8EC'

async function fonts() {
  const dir = join(process.cwd(), 'assets/fonts')
  const [medium, semibold] = await Promise.all([
    readFile(join(dir, 'geist-sans-latin-500-normal.woff')),
    readFile(join(dir, 'geist-sans-latin-600-normal.woff')),
  ])
  return [
    { name: 'Geist', data: medium, weight: 500 as const, style: 'normal' as const },
    { name: 'Geist', data: semibold, weight: 600 as const, style: 'normal' as const },
  ]
}

/** Shared social card: brand mark, a small label, and a large title on the light canvas. */
export async function ogImage({ title, label }: { title: string; label: string }) {
  const size = title.length > 70 ? 56 : title.length > 45 ? 66 : 76
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: CANVAS,
          fontFamily: 'Geist',
          color: INK,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: LIME,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 600,
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
            StudioDesk
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: size,
            fontWeight: 600,
            lineHeight: 1.06,
            letterSpacing: -1,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, fontWeight: 500 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: LIME, border: `3px solid ${INK}` }} />
          {label}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() }
  )
}
