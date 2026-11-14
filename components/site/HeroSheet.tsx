'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Check, X } from 'lucide-react'

gsap.registerPlugin(useGSAP)

const STUDENTS = [
  { name: 'Elif Kaya', credits: 6, present: true },
  { name: 'Mert Aydın', credits: 2, present: true },
  { name: 'Zeynep Arslan', credits: 8, present: false },
  { name: 'Can Yıldız', credits: 4, present: true },
  { name: 'Selin Demir', credits: 1, present: true },
  { name: 'Burak Şahin', credits: 5, present: true },
]

// Read from the theme tokens at runtime so GSAP tweens the real brand colors
const token = (name: string, fallback: string) =>
  typeof window === 'undefined'
    ? fallback
    : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

/**
 * The hero's one orchestrated moment: a real-looking attendance sheet that gets taken,
 * row by row, the way a teacher does it after class. Loops; static for reduced motion.
 */
export function HeroSheet({ bare = false }: { bare?: boolean }) {
  const t = useTranslations('site.hero.sheet')
  const root = useRef<HTMLDivElement>(null)
  const presentTotal = STUDENTS.filter((s) => s.present).length
  const absentTotal = STUDENTS.length - presentTotal

  useGSAP(
    () => {
      const GREEN = token('--success', '#2F8F5B')
      const RED = token('--danger', '#C2412D')
      // 8% tint of a #rrggbb color (GSAP tweens hex-with-alpha)
      const tint = (hex: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + '14' : 'rgba(0,0,0,0.04)')
      const mm = gsap.matchMedia()
      const rows = gsap.utils.toArray<HTMLElement>('[data-row]')
      const counter = root.current?.querySelector<HTMLElement>('[data-counter]')
      const save = root.current?.querySelector<HTMLElement>('[data-save]')
      const saved = root.current?.querySelector<HTMLElement>('[data-saved]')
      if (!counter || !save || !saved) return

      const reset = () => {
        rows.forEach((row, i) => {
          const s = STUDENTS[i]
          const credits = row.querySelector<HTMLElement>('[data-credits]')
          if (credits) credits.textContent = t('credits', { count: s.credits })
        })
        counter.textContent = t('marked', { done: 0, total: STUDENTS.length })
      }

      // Final state, used for reduced motion
      const finish = () => {
        rows.forEach((row, i) => {
          const s = STUDENTS[i]
          const btn = row.querySelector<HTMLElement>(s.present ? '[data-yes]' : '[data-no]')
          if (btn) gsap.set(btn, { backgroundColor: s.present ? GREEN : RED, color: '#fff', borderColor: 'transparent' })
          const credits = row.querySelector<HTMLElement>('[data-credits]')
          if (credits && s.present) credits.textContent = t('credits', { count: s.credits - 1 })
        })
        counter.textContent = t('marked', { done: STUDENTS.length, total: STUDENTS.length })
        gsap.set(save, { autoAlpha: 0 })
        gsap.set(saved, { autoAlpha: 1 })
      }

      mm.add('(prefers-reduced-motion: reduce)', () => {
        finish()
      })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 0.6, onRepeat: reset })
        tl.call(reset)
        tl.set(save, { autoAlpha: 1, scale: 1 })
        tl.set(saved, { autoAlpha: 0, y: 6 })
        tl.set(root.current!.querySelectorAll('[data-yes],[data-no]'), {
          backgroundColor: 'transparent',
          color: 'inherit',
          borderColor: '',
        })
        tl.set(rows, { backgroundColor: 'transparent' })

        rows.forEach((row, i) => {
          const s = STUDENTS[i]
          const btn = row.querySelector<HTMLElement>(s.present ? '[data-yes]' : '[data-no]')
          const credits = row.querySelector<HTMLElement>('[data-credits]')
          tl.to(
            btn,
            {
              backgroundColor: s.present ? GREEN : RED,
              color: '#fff',
              borderColor: 'transparent',
              duration: 0.18,
              ease: 'power2.out',
            },
            i === 0 ? '+=0.2' : '+=0.38'
          )
          tl.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, '<')
          tl.to(row, { backgroundColor: tint(s.present ? GREEN : RED), duration: 0.2 }, '<')
          tl.call(() => {
            if (credits && s.present) credits.textContent = t('credits', { count: s.credits - 1 })
            counter.textContent = t('marked', { done: i + 1, total: STUDENTS.length })
          })
        })

        tl.to(save, { scale: 0.96, duration: 0.12, ease: 'power1.in' }, '+=0.5')
        tl.to(save, { scale: 1, autoAlpha: 0, duration: 0.2 })
        tl.to(saved, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '<')
        tl.to({}, { duration: 1.4 })
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} className="relative">
      {/* Phone-sized sheet */}
      <div
        className={
          bare
            ? 'relative w-full overflow-hidden rounded-2xl border border-border bg-background'
            : 'relative mx-auto w-full max-w-sm overflow-hidden rounded-[28px] border border-border bg-background shadow-[0_30px_80px_-30px_rgba(28,25,23,0.35)]'
        }
      >
        <div className="border-b border-border px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-foreground">{t('course')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('when')}</p>
            </div>
            <p data-counter className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">
              {t('marked', { done: 0, total: STUDENTS.length })}
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {STUDENTS.map((s) => (
            <li key={s.name} data-row className="flex items-center gap-3 px-5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                <p data-credits className="text-xs tabular-nums text-muted-foreground">
                  {t('credits', { count: s.credits })}
                </p>
              </div>
              <div className="flex overflow-hidden rounded-lg text-xs font-medium text-muted-foreground">
                <span data-yes className="flex h-8 items-center gap-1 rounded-l-lg border border-border px-2.5">
                  <Check className="size-3.5" /> {t('present')}
                </span>
                <span data-no className="-ml-px flex h-8 items-center gap-1 rounded-r-lg border border-border px-2.5">
                  <X className="size-3.5" />
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="relative border-t border-border px-5 py-4">
          <div data-save className="flex h-10 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
            {t('save')}
          </div>
          <div
            data-saved
            className="invisible absolute inset-x-5 top-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-muted text-sm font-medium text-foreground opacity-0"
          >
            <Check className="size-4 text-green-600" />
            {t('saved', { present: presentTotal, absent: absentTotal })}
          </div>
        </div>
      </div>
    </div>
  )
}
