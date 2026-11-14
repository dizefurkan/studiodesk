import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { ConfirmProvider } from '@/components/common/ConfirmProvider'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocaleLayoutProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: {
      template: '%s | StudioDesk',
      default: t('defaultTitle'),
    },
    description: t('description'),
    keywords: t('keywords'),
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!hasLocale(SUPPORTED_LOCALES, locale)) {
    notFound()
  }

  // Explicitly load messages for the locale
  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ConfirmProvider>{children}</ConfirmProvider>
    </NextIntlClientProvider>
  )
}
