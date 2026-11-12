import { redirect } from 'next/navigation'

// Public sign-up is disabled; accounts are created from /backoffice.
export default function RegisterPage() {
  redirect('/login')
}
