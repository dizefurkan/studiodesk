import { getDanceType } from '@/lib/actions/dance-types.actions'
import { notFound } from 'next/navigation'
import { DanceTypeForm } from '@/components/dance-types/DanceTypeForm'

interface EditDanceTypePageProps {
  params: {
    id: string
  }
}

export default async function EditDanceTypePage({ params }: EditDanceTypePageProps) {
  const { id } = await params
  const result = await getDanceType(id)

  if (result.error) {
    notFound()
  }

  const danceType = result.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <DanceTypeForm danceType={danceType} />
    </div>
  )
}
