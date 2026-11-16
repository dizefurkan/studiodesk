import { notFound } from 'next/navigation'
import { InstructorForm } from '@/components/instructors/InstructorForm'
import { getInstructor } from '@/lib/actions/instructors.actions'

interface EditInstructorPageProps {
  params: {
    id: string
  }
}

export default async function EditInstructorPage({ params }: EditInstructorPageProps) {
  const { id } = await params
  const result = await getInstructor(id)

  if (result.error || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <InstructorForm instructor={result.data} />
      </div>
    </div>
  )
}
