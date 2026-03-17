import { getOrganization } from '@/lib/auth/getOrganization'
import { DEFAULT_CURRENCY } from '@/config/currencies'
import { PackagesPageContent } from './packages-client'

export default async function PackagesPage() {
  const organization = await getOrganization()
  const currency = organization?.currency || DEFAULT_CURRENCY

  return <PackagesPageContent currency={currency} />
}
