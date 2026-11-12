import { redirect } from 'next/navigation'

// Self-service onboarding is disabled; stores are created from /backoffice.
export default function OnboardingPage() {
  redirect('/dashboard')
}
