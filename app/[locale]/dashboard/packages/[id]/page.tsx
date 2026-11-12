import { getPackage } from '@/lib/actions/packages.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Gift, Edit2 } from 'lucide-react'

interface PackageDetailPageProps {
  params: {
    id: string
  }
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params
  const result = await getPackage(id)

  if (result.error) {
    notFound()
  }

  const pkg = result.data!

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/50 to-white p-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/packages" className="text-primary hover:underline mb-6 inline-block">
          ← Back to Packages
        </Link>

        <Card className="border-border">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{pkg.name}</h1>
                <p className="text-muted-foreground">Package Details</p>
              </div>
              <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                <Button className="gap-2">
                  <Edit2 size={18} />
                  Edit
                </Button>
              </Link>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Credits</p>
                  <p className="text-2xl font-bold text-primary">{pkg.total_credits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-2xl font-bold text-foreground">${pkg.price.toFixed(2)}</p>
                </div>
              </div>

              {pkg.dance_type_id && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dance Type</p>
                  <div className="inline-block bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-full text-sm">
                    {pkg.dance_type_id}
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
