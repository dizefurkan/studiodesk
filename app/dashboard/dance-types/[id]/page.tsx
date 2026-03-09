import { getDanceType } from '@/lib/actions/dance-types.actions'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, edit } from 'lucide-react'

interface DanceTypeDetailPageProps {
  params: {
    id: string
  }
}

export default async function DanceTypeDetailPage({ params }: DanceTypeDetailPageProps) {
  const result = await getDanceType(params.id)

  if (result.error) {
    notFound()
  }

  const danceType = result.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/dance-types" className="text-[#4F46E5] hover:underline mb-6 inline-block">
          ← Back to Dance Types
        </Link>

        <Card className="border-[#E5E7EB]">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#111827] mb-2">{danceType.name}</h1>
                <p className="text-gray-600">Dance Style</p>
              </div>
              <Link href={`/dashboard/dance-types/${danceType.id}/edit`}>
                <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
                  <edit size={18} />
                  Edit
                </Button>
              </Link>
            </div>

            {danceType.description && (
              <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-700 text-base leading-relaxed">{danceType.description}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
