import { Link } from '@/i18n/navigation'
import { getDanceType } from '@/lib/actions/dance-types.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface DanceTypeDetailPageProps {
  params: {
    id: string
  }
}

export default async function DanceTypeDetailPage({ params }: DanceTypeDetailPageProps) {
  const tx = await getTranslations('danceTypeDetail')
  const td = await getTranslations('detailPages')
  const { id } = await params
  const result = await getDanceType(id)

  if (result.error) {
    notFound()
  }

  const danceType = result.data!

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <Link href="/dashboard/dance-types" className="text-primary hover:underline mb-6 inline-block">
          {tx('backToList')}
        </Link>

        <Card className="border-border">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{danceType.name}</h1>
                <p className="text-muted-foreground">{tx('subtitle')}</p>
              </div>
              <Link href={`/dashboard/dance-types/${danceType.id}/edit`}>
                <Button className="gap-2">
                  <Edit2 size={18} />
                  {td('edit')}
                </Button>
              </Link>
            </div>

            {danceType.description && (
              <div className="space-y-4 border-t border-border pt-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{tx('description')}</p>
                  <p className="text-foreground/80 text-base leading-relaxed">{danceType.description}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
