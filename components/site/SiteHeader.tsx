'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher'

export function SiteHeader() {
  const t = useTranslations('site.nav')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '/#who', label: t('who') },
    { href: '/#how', label: t('how') },
    { href: '/#features', label: t('features') },
    { href: '/#pricing', label: t('pricing') },
    { href: '/#faq', label: t('faq') },
    { href: '/blog', label: t('blog') },
  ]

  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4">
      <div
        className={cn(
          'mx-auto max-w-4xl rounded-full bg-ink text-ink-foreground transition-shadow',
          scrolled && 'shadow-[0_12px_40px_-12px_rgb(var(--shadow-ink)/0.45)]'
        )}
      >
        <div className="flex h-14 items-center justify-between gap-3 pl-3 pr-2 sm:pl-4">
          <Link href="/" className="inline-flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight">
            <Logo inverted />
          </Link>

          <nav className="hidden items-center lg:flex" aria-label={t('label')}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="whitespace-nowrap rounded-full px-3 py-2 text-sm text-ink-foreground/70 transition-colors hover:text-ink-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/login" className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm text-ink-foreground/70 transition-colors hover:text-ink-foreground sm:block">
              {t('signIn')}
            </Link>
            <Button asChild size="sm" className="hidden h-10 rounded-full bg-highlight px-4 text-highlight-foreground hover:bg-highlight/90 sm:inline-flex">
              <Link href="/#demo">{t('demo')}</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? t('closeMenu') : t('openMenu')}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-nav"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mx-auto mt-2 max-w-4xl rounded-3xl bg-ink p-3 text-ink-foreground lg:hidden"
            aria-label={t('label')}
          >
            <div className="flex flex-col">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-2xl px-3 py-3 text-base hover:bg-ink-foreground/10">
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button asChild variant="ghost" className="rounded-full text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground">
                  <Link href="/login">{t('signIn')}</Link>
                </Button>
                <Button asChild className="rounded-full bg-highlight text-highlight-foreground hover:bg-highlight/90">
                  <Link href="/#demo" onClick={() => setOpen(false)}>
                    {t('demo')}
                  </Link>
                </Button>
              </div>
              <div className="mt-2 flex justify-center gap-1 text-ink-foreground/70 [&_button]:text-ink-foreground/70">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
