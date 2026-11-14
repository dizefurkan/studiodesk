'use client'

import { useTranslations } from 'next-intl'
import { motion, useReducedMotion } from 'motion/react'
import { Check, MapPin, Smartphone, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

/** Feature grid with one small, live-looking illustration per cell. */
export function Bento() {
  const t = useTranslations('site.features.bento')
  const reduce = useReducedMotion()
  const cell = 'relative overflow-hidden rounded-3xl bg-background p-6 sm:p-7'

  const inView = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-60px' },
          transition: { duration: 0.6, delay, ease },
        }

  return (
    <div className="grid gap-4 md:grid-cols-6">
      {/* Attendance */}
      <motion.div {...inView()} className={cn(cell, 'md:col-span-4 md:row-span-2')}>
        <Title title={t('attendance.title')} text={t('attendance.text')} />
        <div className="mt-6 rounded-2xl bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">{t('attendance.course')}</p>
            <span className="rounded-full bg-highlight px-2.5 py-1 text-xs font-medium text-highlight-foreground">{t('attendance.all')}</span>
          </div>
          {[
            ['Elif Kaya', true],
            ['Can Yıldız', true],
            ['Zeynep Arslan', false],
            ['Burak Şahin', true],
          ].map(([name, ok], i) => (
            <motion.div
              key={name as string}
              className="flex items-center justify-between border-t border-border py-2.5 text-sm"
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.12, ease }}
            >
              <span>{name as string}</span>
              <span
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
                  ok ? 'bg-success text-white' : 'bg-danger text-white'
                )}
              >
                {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                {ok ? t('attendance.present') : t('attendance.absent')}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Credits */}
      <motion.div {...inView(0.08)} className={cn(cell, 'md:col-span-2')}>
        <Title title={t('credits.title')} text={t('credits.text')} />
        <div className="mt-6 flex items-baseline gap-3 font-display tabular-nums">
          <span className="text-4xl font-semibold text-muted-foreground/50 line-through decoration-2">8</span>
          <motion.span
            className="text-6xl font-semibold text-primary"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5, ease }}
          >
            7
          </motion.span>
          <span className="font-sans text-sm text-muted-foreground">{t('credits.unit')}</span>
        </div>
      </motion.div>

      {/* Pay */}
      <motion.div {...inView(0.16)} className={cn(cell, 'md:col-span-2')}>
        <Title title={t('pay.title')} text={t('pay.text')} />
        <div className="mt-6 flex h-20 items-end gap-2">
          {[40, 65, 50, 85, 70, 95].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 origin-bottom rounded-t-md bg-highlight"
              style={{ height: `${h}%` }}
              initial={reduce ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.06, ease }}
            />
          ))}
        </div>
      </motion.div>

      {/* Branches */}
      <motion.div {...inView()} className={cn(cell, 'md:col-span-2')}>
        <Title title={t('branches.title')} text={t('branches.text')} />
        <ul className="mt-5 flex flex-wrap gap-2">
          {['Kadıköy', 'Beşiktaş', 'Ataşehir'].map((b) => (
            <li key={b} className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm">
              <MapPin className="size-3.5 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Cash */}
      <motion.div {...inView(0.08)} className={cn(cell, 'md:col-span-2')}>
        <Title title={t('cash.title')} text={t('cash.text')} />
        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between rounded-xl bg-surface px-3 py-2">
            <span className="text-muted-foreground">{t('cash.income')}</span>
            <span className="font-medium tabular-nums text-success">+₺2.400</span>
          </div>
          <div className="flex justify-between rounded-xl bg-surface px-3 py-2">
            <span className="text-muted-foreground">{t('cash.expense')}</span>
            <span className="font-medium tabular-nums text-danger">−₺18.000</span>
          </div>
        </div>
      </motion.div>

      {/* Phone */}
      <motion.div {...inView(0.16)} className={cn(cell, 'md:col-span-2')}>
        <Title title={t('phone.title')} text={t('phone.text')} />
        <Smartphone aria-hidden className="absolute -bottom-6 -right-4 hidden size-32 text-highlight md:block" strokeWidth={1.2} />
      </motion.div>
    </div>
  )
}

function Title({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative">
      <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}
