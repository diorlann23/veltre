'use client'

import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-mute">We couldn’t load this page. Please check your connection and try again.</p>
      <Button className="mt-8" onClick={reset}>
        <RotateCcw className="size-4" aria-hidden="true" /> Try again
      </Button>
    </div>
  )
}
