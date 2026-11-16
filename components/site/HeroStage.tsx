'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { HeroSheet } from './HeroSheet'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const ease = [0.22, 1, 0.36, 1] as const

/**
 * A phone in the middle taking attendance, with the rest of the studio fanned out around it.
 * Cards slide out from behind the phone on load (motion) and drift apart as you scroll (GSAP).
 */
export function HeroStage() {
  const t = useTranslations('site.hero.stage')
  const root = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const st = { trigger: root.current, start: 'top 60%', end: 'bottom top', scrub: 0.8 }
        gsap.to('[data-side="l"]', { xPercent: -14, yPercent: -6, ease: 'none', scrollTrigger: st })
        gsap.to('[data-side="r"]', { xPercent: 14, yPercent: -6, ease: 'none', scrollTrigger: st })
        gsap.to('[data-phone]', { yPercent: -4, ease: 'none', scrollTrigger: st })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  const card = 'h-[300px] w-[210px] shrink-0 overflow-hidden rounded-3xl p-5'
  const enter = (fromX: number, delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, x: fromX, scale: 0.9 },
          animate: { opacity: 1, x: 0, scale: 1 },
          transition: { duration: 0.9, delay, ease },
        }

  return (
    <div ref={root} className="relative">
      <div className="flex items-center justify-center gap-4 xl:gap-5">
        {/* left */}
        <div data-side="l" className="hidden items-center gap-4 lg:flex xl:gap-5">
          <motion.div {...enter(160, 0.75)} className={cn(card, 'translate-y-6 bg-ink text-ink-foreground')}>
            <p className="text-sm text-ink-foreground/60">{t('revenue')}</p>
            <p className="mt-2 font-display text-3xl font-medium tabular-nums">₺86.200</p>
            <div className="mt-8 flex h-28 items-end gap-1.5">
              {[30, 46, 38, 60, 52, 78, 70, 92].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-highlight/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </motion.div>
          <motion.div {...enter(80, 0.65)} className={cn(card, 'bg-highlight text-highlight-foreground')}>
            <p className="text-sm text-highlight-foreground/70">{t('today')}</p>
            <p className="mt-1 font-display text-7xl font-medium tabular-nums leading-none">4</p>
            <p className="mt-1 text-sm">{t('lessons')}</p>
            <ul className="mt-6 space-y-1.5 text-sm">
              <li className="flex justify-between"><span>Bale</span><span className="tabular-nums">18:30</span></li>
              <li className="flex justify-between"><span>Salsa 1</span><span className="tabular-nums">19:00</span></li>
              <li className="flex justify-between"><span>Tango</span><span className="tabular-nums">20:00</span></li>
            </ul>
          </motion.div>
        </div>

        {/* phone */}
        <motion.div
          data-phone
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease }}
          className="relative z-10 w-[300px] shrink-0 rounded-[44px] border-[10px] border-foreground bg-ink shadow-[0_40px_80px_-30px_rgb(var(--shadow-ink)/0.45)] sm:w-[320px]"
        >
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
          <div className="overflow-hidden rounded-[34px] bg-background pt-8">
            <HeroSheet bare />
          </div>
        </motion.div>

        {/* right */}
        <div data-side="r" className="hidden items-center gap-4 lg:flex xl:gap-5">
          <motion.div {...enter(-80, 0.65)} className={cn(card, 'border border-border bg-background')}>
            <p className="text-sm text-muted-foreground">{t('renewals')}</p>
            <ul className="mt-4 space-y-3">
              {[
                ['Selin Demir', 1],
                ['Mert Aydın', 1],
                ['Ece Korkmaz', 0],
              ].map(([n, c]) => (
                <li key={n as string} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{n as string}</span>
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium tabular-nums text-warning">
                    {t('credits', { count: c as number })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-highlight px-3 py-2 text-center text-sm font-medium text-highlight-foreground">
              {t('sell')}
            </p>
          </motion.div>
          <motion.div {...enter(-160, 0.75)} className={cn(card, 'translate-y-6 bg-primary text-primary-foreground')}>
            <p className="text-sm text-primary-foreground/70">{t('pay')}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between gap-2"><span>Deniz A.</span><span className="tabular-nums">18</span></li>
              <li className="flex justify-between gap-2"><span>Ece K.</span><span className="tabular-nums">12</span></li>
              <li className="flex justify-between gap-2"><span>Kerem T.</span><span className="tabular-nums">9</span></li>
            </ul>
            <p className="mt-6 font-display text-3xl font-medium tabular-nums">₺31.750</p>
            <p className="text-xs text-primary-foreground/70">{t('payNote')}</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
