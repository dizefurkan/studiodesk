import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
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
  return {
    title: {
      template: '%s | StudioDesk',
      default: 'StudioDesk - Dance Studio Management',
    },
    description: 'All-in-one platform for managing dance studios',
    keywords: 'dance studio, management, scheduling, students, instructors',
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!SUPPORTED_LOCALES.includes(locale as any)) {
    notFound()
  }

  // Explicitly load messages for the locale
  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
