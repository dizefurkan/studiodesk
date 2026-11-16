'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Lime pill above the hero headline that cycles through the kinds of studio, in order.
 * Screen readers get the full sentence once (`label`); the rotating words are decorative.
 */
export function RotatingBadge({ items, label, interval = 2200 }: { items: string[]; label: string; interval?: number }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduce || items.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval)
    return () => clearInterval(id)
  }, [reduce, items.length, interval])

  return (
    <motion.p
      layout={!reduce}
      transition={{ layout: { duration: 0.45, ease } }}
      className="inline-flex items-center gap-2 overflow-hidden rounded-full bg-highlight px-3.5 py-1.5 text-sm font-medium text-highlight-foreground"
    >
      <span className="sr-only">{label}</span>
      <motion.span layout="position" className="size-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
      <span aria-hidden className="relative inline-flex h-5 items-center">
        {reduce ? (
          items[0]
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={index}
              className="inline-block whitespace-nowrap"
              initial={{ y: '110%', opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: '-110%', opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.45, ease }}
            >
              {items[index]}
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </motion.p>
  )
}
