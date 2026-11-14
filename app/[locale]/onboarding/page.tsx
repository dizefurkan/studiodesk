import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'

// Self-service onboarding is disabled; stores are created from /backoffice.
export default async function OnboardingPage() {
  redirect({ href: '/dashboard', locale: await getLocale() })
}
