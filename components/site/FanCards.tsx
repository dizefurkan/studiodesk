'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export interface FanCard {
  title: string
  value: string
  note: string
  tone: 'lime' | 'light' | 'olive' | 'ink'
}

const TONES: Record<FanCard['tone'], string> = {
  lime: 'bg-highlight text-highlight-foreground',
  light: 'bg-background text-foreground',
  olive: 'bg-primary text-primary-foreground',
  ink: 'bg-background/10 text-background border border-background/15',
}

/** A row of cards that fan out (rotate, lift) as the section scrolls into view. */
export function FanCards({ cards }: { cards: FanCard[] }) {
  const root = useRef<HTMLDivElement>(null)
  const mid = (cards.length - 1) / 2

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-fan]').forEach((el, i) => {
          const off = i - mid
          gsap.fromTo(
            el,
            { rotate: 0, y: 40, opacity: 0.4 },
            {
              rotate: off * 5,
              y: Math.abs(off) * 18,
              opacity: 1,
              ease: 'none',
              scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top 40%', scrub: 0.6 },
            }
          )
        })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} className="flex snap-x gap-3 overflow-x-auto pb-4 md:justify-center md:overflow-visible md:pb-10">
      {cards.map((c, i) => (
        <div
          key={i}
          data-fan
          className={cn(
            'flex h-56 w-44 shrink-0 snap-center flex-col justify-between rounded-3xl p-5 sm:w-48',
            TONES[c.tone]
          )}
        >
          <p className="text-sm opacity-75">{c.title}</p>
          <div>
            <p className="font-display text-4xl font-medium tabular-nums leading-none">{c.value}</p>
            <p className="mt-2 text-xs opacity-75">{c.note}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
