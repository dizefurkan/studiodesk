'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { ArrowRight, Banknote, ClipboardCheck, Coins, RefreshCw, Wallet, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  attendance: ClipboardCheck,
  credits: Coins,
  pay: Wallet,
  renewals: RefreshCw,
  cash: Banknote,
}

const ease = [0.22, 1, 0.36, 1] as const

/**
 * "How it's done today" turning into "with StudioDesk", one job per row. As a row scrolls into
 * view the old way is struck through and the StudioDesk way slides in on a lime card.
 */
export function Compare({
  beforeTitle,
  afterTitle,
  rows,
}: {
  beforeTitle: string
  afterTitle: string
  rows: Array<{ key: string; job: string; before: string; after: string }>
}) {
  const reduce = useReducedMotion()

  return (
    <div className="rounded-[2rem] bg-ink p-3 text-ink-foreground sm:p-5">
      <div className="hidden grid-cols-[minmax(0,13rem)_1fr_2.5rem_1fr] gap-4 px-4 pb-3 pt-2 text-sm md:grid">
        <span />
        <span className="text-ink-foreground/50">{beforeTitle}</span>
        <span />
        <span className="font-medium text-highlight">{afterTitle}</span>
      </div>
      <ul className="space-y-2">
        {rows.map((r, i) => {
          const Icon = ICONS[r.key] ?? ClipboardCheck
          const delay = i * 0.08
          return (
            <motion.li
              key={r.key}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay, ease }}
              className="group grid items-center gap-3 rounded-3xl bg-ink-foreground/[0.04] p-4 transition-colors hover:bg-ink-foreground/[0.07] md:grid-cols-[minmax(0,13rem)_1fr_2.5rem_1fr] md:gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-ink-foreground/10 text-highlight">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-display text-lg font-medium">{r.job}</span>
              </div>

              <StruckText label={beforeTitle} text={r.before} delay={delay + 0.35} />

              <span className="hidden size-10 items-center justify-center rounded-full bg-highlight/15 text-highlight transition-transform group-hover:translate-x-0.5 md:flex">
                <ArrowRight className="size-4" aria-hidden />
              </span>

              <motion.p
                initial={reduce ? false : { opacity: 0, x: -12, scale: 0.97 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: delay + 0.55, ease }}
                className="rounded-2xl bg-highlight px-4 py-3 text-sm font-medium text-highlight-foreground"
              >
                <span className="sr-only">{afterTitle}: </span>
                {r.after}
              </motion.p>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

/** The old way, struck through (every line) once it scrolls into view. */
function StruckText({ label, text, delay }: { label: string; text: string; delay: number }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <p
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={cn(
        'text-sm text-ink-foreground/55 line-through decoration-transparent transition-[text-decoration-color] duration-700 motion-reduce:transition-none',
        inView && 'decoration-ink-foreground/45'
      )}
    >
      <span className="sr-only">{label}: </span>
      {text}
    </p>
  )
}
