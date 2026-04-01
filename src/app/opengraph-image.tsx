import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Things Review'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          gap: '24px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-2px',
            textAlign: 'center',
          }}
        >
          Things Review
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          Review the things you love, together.
        </div>
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            gap: '16px',
          }}
        >
          {['Movies', 'Series', 'Music', 'Games', 'Books'].map((item) => (
            <div
              key={item}
              style={{
                background: '#27272a',
                color: '#d4d4d8',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: 18,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
