import { notFound } from 'next/navigation'
import { InstructorForm } from '@/components/instructors/InstructorForm'
import { getInstructor } from '@/lib/actions/instructors.actions'

interface EditInstructorPageProps {
  params: {
    id: string
  }
}

export default async function EditInstructorPage({ params }: EditInstructorPageProps) {
  const result = await getInstructor(params.id)

  if (result.error || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <InstructorForm instructor={result.data} />
    </div>
  )
}
