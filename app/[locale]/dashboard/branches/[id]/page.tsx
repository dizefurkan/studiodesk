import { Link } from '@/i18n/navigation'
import { getBranch } from '@/lib/actions/branches.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Edit2, Music } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface BranchDetailPageProps {
  params: {
    id: string
  }
}

export default async function BranchDetailPage({ params }: BranchDetailPageProps) {
  const tx = await getTranslations('branchDetail')
  const td = await getTranslations('detailPages')
  const { id } = await params
  const result = await getBranch(id)

  if (result.error) {
    notFound()
  }

  const branch = result.data!

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <Link href="/dashboard/branches" className="text-primary hover:underline mb-6 inline-block">
          {tx('backToList')}
        </Link>

        <Card className="border-border">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{branch.name}</h1>
                <p className="text-muted-foreground">{tx('subtitle')}</p>
              </div>
              <Link href={`/dashboard/branches/${branch.id}/edit`}>
                <Button className="gap-2">
                  <Edit2 size={18} />
                  {td('edit')}
                </Button>
              </Link>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
              {branch.address && (
                <div className="flex items-center gap-4">
                  <MapPin className="text-primary" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">{tx('address')}</p>
                    <p className="text-lg font-medium text-foreground">{branch.address}</p>
                  </div>
                </div>
              )}

              {branch.phone && (
                <div className="flex items-center gap-4">
                  <Phone className="text-primary" size={20} />
                  <div>
                    <p className="text-sm text-muted-foreground">{td('phone')}</p>
                    <p className="text-lg font-medium text-foreground">{branch.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="border-border mt-6">
          <div className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">{tx('studiosTitle')}</h2>
            <p className="text-muted-foreground mb-6">{tx('studiosDescription')}</p>
            <Link href={`/dashboard/branches/${branch.id}/studios`}>
              <Button className="gap-2">
                <Music size={18} />
                {tx('manageStudios')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
