'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f4f2ee', color: '#0e0e0e', margin: 0 }}>
        <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0 }}>We’ll be right back</h1>
            <p style={{ color: '#5e5b57', maxWidth: 360 }}>The store is temporarily unavailable. Please try again in a moment.</p>
            <button
              onClick={reset}
              style={{ marginTop: 16, height: 44, padding: '0 24px', borderRadius: 999, border: 0, background: '#0e0e0e', color: '#f4f2ee', fontWeight: 600 }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
