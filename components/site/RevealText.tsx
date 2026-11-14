'use client'

import { motion, useReducedMotion } from 'motion/react'

/**
 * Headline that rises in word by word on load (blur → sharp). One orchestrated moment;
 * plain text for reduced motion and for crawlers (the words are real text).
 */
export function RevealText({
  text,
  as: Tag = 'h1',
  className,
  delay = 0.1,
}: {
  text: string
  as?: 'h1' | 'h2' | 'p'
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  if (reduce) return <Tag className={className}>{text}</Tag>

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '0.9em', opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  )
}

/** Fades content up once when it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
