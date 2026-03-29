import { getCourse } from '@/lib/actions/courses.actions'
import { notFound } from 'next/navigation'
import { CourseForm } from '@/components/courses/CourseForm'

interface EditCoursePageProps {
  params: {
    id: string
  }
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params
  const result = await getCourse(id)

  if (result.error) {
    notFound()
  }

  const course = result.data

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white p-4 sm:p-6 md:p-8">
      <CourseForm course={course} />
    </div>
  )
}
