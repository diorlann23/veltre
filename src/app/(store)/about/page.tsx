import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { SmartImage } from '@/components/ui/SmartImage'
import { getSettings } from '@/server/repos/settings'

export const metadata: Metadata = { title: 'About' }

export default async function AboutPage() {
  const s = await getSettings()
  const paragraphs = s.aboutBody.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return (
    <div>
      <section className="container-x pt-8 lg:pt-14">
        <p className="eyebrow">About {s.brandName}</p>
        <h1 className="mt-4 max-w-5xl text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] font-semibold tracking-[-0.03em]">{s.aboutHeading}</h1>
      </section>
      <section className="container-x pt-14 lg:pt-20">
        <div className={`grid gap-10 lg:gap-16 ${s.aboutImage ? 'lg:grid-cols-12' : ''}`}>
          {s.aboutImage && (
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-bone lg:col-span-6">
              <SmartImage src={s.aboutImage} alt={s.brandName} priority className="absolute inset-0 size-full object-cover" />
            </div>
          )}
          <div className={`flex flex-col justify-center ${s.aboutImage ? 'lg:col-span-5 lg:col-start-8' : 'max-w-2xl'}`}>
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'text-xl leading-relaxed sm:text-2xl' : 'mt-6 leading-relaxed text-mute'}>
                {p}
              </p>
            ))}
            <Link href="/shop" className={buttonClasses('primary', 'lg', 'mt-10 self-start')}>
              Shop the collection <ArrowRight className="size-4 transition group-hover/btn:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
