import { getBranch } from '@/lib/actions/branches.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, Phone, edit } from 'lucide-react'

interface BranchDetailPageProps {
  params: {
    id: string
  }
}

export default async function BranchDetailPage({ params }: BranchDetailPageProps) {
  const { id } = await params
  const result = await getBranch(id)

  if (result.error) {
    notFound()
  }

  const branch = result.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/branches" className="text-[#4F46E5] hover:underline mb-6 inline-block">
          ← Back to Branches
        </Link>

        <Card className="border-[#E5E7EB]">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] mb-2">{branch.name}</h1>
                <p className="text-gray-600">Branch Information</p>
              </div>
              <Link href={`/dashboard/branches/${branch.id}/edit`}>
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                  <edit size={18} />
                  Edit
                </Button>
              </Link>
            </div>

            <div className="space-y-6 border-t border-[#E5E7EB] pt-6">
              {branch.address && (
                <div className="flex items-center gap-4">
                  <MapPin className="text-[#4F46E5]" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="text-lg font-medium text-[#111827]">{branch.address}</p>
                  </div>
                </div>
              )}

              {branch.phone && (
                <div className="flex items-center gap-4">
                  <Phone className="text-[#4F46E5]" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-lg font-medium text-[#111827]">{branch.phone}</p>
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
