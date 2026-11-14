import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

// Public sign-up is disabled; accounts are created from /backoffice.
export default async function RegisterPage() {
  redirect({ href: '/login', locale: await getLocale() })
}
