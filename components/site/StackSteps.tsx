'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { StepPanel, STEPS } from './StepPanel'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * The four steps of a studio week as cards that stack while you scroll (CSS sticky);
 * GSAP eases each covered card back a little so the stack reads as depth.
 */
export function StackSteps() {
  const t = useTranslations('site.how')
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('[data-card]')
        cards.forEach((card, i) => {
          const next = cards[i + 1]
          if (!next) return
          gsap.to(card, {
            scale: 0.96,
            ease: 'none',
            scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 30%', scrub: true },
          })
        })
      })
      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} className="space-y-6">
      {STEPS.map((step, i) => (
        <div
          key={step}
          data-card
          className="sticky origin-top"
          style={{ top: `${88 + i * 18}px` }}
        >
          <div className="grid gap-6 rounded-3xl bg-background p-6 shadow-[0_20px_60px_-40px_rgb(var(--shadow-ink)/0.35)] sm:p-8 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-10 md:p-10">
            <div>
              <p className="inline-flex rounded-full bg-highlight px-3 py-1 text-sm font-medium tabular-nums text-highlight-foreground">
                {t('stepLabel', { n: i + 1, total: STEPS.length })}
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {t(`steps.${step}.title`)}
              </h3>
              <p className="mt-3 max-w-md text-muted-foreground">{t(`steps.${step}.text`)}</p>
            </div>
            <StepPanel step={step} />
          </div>
        </div>
      ))}
    </div>
  )
}
