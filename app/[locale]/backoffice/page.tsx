import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

export default async function BackofficeIndex() {
  redirect({ href: '/backoffice/stores', locale: await getLocale() })
}
