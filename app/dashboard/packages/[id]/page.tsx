import { getPackage, getDanceTypeForPackage } from '@/lib/actions/packages.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Gift, edit } from 'lucide-react'

interface PackageDetailPageProps {
  params: {
    id: string
  }
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const result = await getPackage(params.id)

  if (result.error) {
    notFound()
  }

  const pkg = result.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/packages" className="text-[#4F46E5] hover:underline mb-6 inline-block">
          ← Back to Packages
        </Link>

        <Card className="border-[#E5E7EB]">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] mb-2">{pkg.name}</h1>
                <p className="text-gray-600">Package Details</p>
              </div>
              <Link href={`/dashboard/packages/${pkg.id}/edit`}>
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                  <edit size={18} />
                  Edit
                </Button>
              </Link>
            </div>

            <div className="space-y-6 border-t border-[#E5E7EB] pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Credits</p>
                  <p className="text-2xl font-bold text-[#4F46E5]">{pkg.total_credits}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  <p className="text-2xl font-bold text-[#111827]">${pkg.price.toFixed(2)}</p>
                </div>
              </div>

              {pkg.dance_type_id && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Dance Type</p>
                  <div className="inline-block bg-[#4F46E5] bg-opacity-10 text-[#4F46E5] px-3 py-1 rounded-full text-sm">
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
