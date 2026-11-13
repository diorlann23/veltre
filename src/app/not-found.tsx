import Link from 'next/link'
import { buttonClasses } from '@/components/ui/buttonStyles'

export default function NotFound() {
  return (
    <main className="container-x flex min-h-[80dvh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-[clamp(6rem,22vw,14rem)] leading-none font-semibold tracking-[-0.05em] text-bone select-none" aria-hidden="true">
        404
      </p>
      <h1 className="-mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-mute">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonClasses('primary', 'lg')}>Shop now</Link>
        <Link href="/" className={buttonClasses('secondary', 'lg')}>Back home</Link>
      </div>
    </main>
  )
}
