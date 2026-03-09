import { notFound } from 'next/navigation'
import { StudentForm } from '@/components/students/StudentForm'
import { getStudent } from '@/lib/actions/students.actions'

interface EditStudentPageProps {
  params: {
    id: string
  }
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const result = await getStudent(params.id)

  if (result.error || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <StudentForm student={result.data} />
    </div>
  )
}
