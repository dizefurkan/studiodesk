'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { onOpenConsentPreferences, saveConsent } from '@/lib/consent'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useConsent } from './useConsent'

/** Bottom banner for first-time visitors + the preferences dialog (also opened from the footer). */
export function CookieConsent() {
  const t = useTranslations('consent')
  const consent = useConsent()
  const [open, setOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(
    () =>
      onOpenConsentPreferences(() => {
        setAnalytics(consent?.analytics ?? false)
        setOpen(true)
      }),
    [consent]
  )

  const showBanner = consent === null && !open

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label={t('bannerLabel')}
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-background p-4 shadow-lg sm:inset-x-auto sm:left-4 sm:p-5"
        >
          <p className="text-sm text-foreground">
            {t('bannerText')}{' '}
            <Link href="/legal/cookies" className="underline underline-offset-2 hover:text-primary">
              {t('policyLink')}
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => saveConsent(true)}>
              {t('acceptAll')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => saveConsent(false)}>
              {t('rejectAll')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAnalytics(false)
                setOpen(true)
              }}
            >
              {t('preferences')}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
            <DialogDescription>{t('dialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border">
            <div className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('necessaryTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('necessaryText')}</p>
              </div>
              <Switch checked disabled aria-label={t('necessaryTitle')} />
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('analyticsTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('analyticsText')}</p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label={t('analyticsTitle')} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => { saveConsent(false); setOpen(false) }}>
              {t('rejectAll')}
            </Button>
            <Button onClick={() => { saveConsent(analytics); setOpen(false) }}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
