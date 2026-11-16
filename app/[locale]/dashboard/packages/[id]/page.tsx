import { Link } from '@/i18n/navigation'
import { getPackage } from '@/lib/actions/packages.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { getOrganization } from '@/lib/auth/getOrganization'
import { getTranslations } from 'next-intl/server'

interface PackageDetailPageProps {
  params: {
    id: string
  }
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const tx = await getTranslations('packageDetail')
  const td = await getTranslations('detailPages')
  const currency = (await getOrganization())?.currency || 'TRY'
  const { id } = await params
  const result = await getPackage(id)

  if (result.error) {
    notFound()
  }

  const pkg = result.data!

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <Link href="/dashboard/packages" className="text-primary hover:underline mb-6 inline-block">
          {tx('backToList')}
        </Link>

        <Card className="border-border">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{pkg.name}</h1>
                <p className="text-muted-foreground">{tx('subtitle')}</p>
              </div>
              <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                <Button className="gap-2">
                  <Edit2 size={18} />
                  {td('edit')}
                </Button>
              </Link>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{tx('totalCredits')}</p>
                  <p className="text-2xl font-bold text-primary">{pkg.total_credits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{tx('price')}</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(pkg.price, currency)}</p>
                </div>
              </div>

              {pkg.dance_types?.name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{tx('danceType')}</p>
                  <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    {pkg.dance_types.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
