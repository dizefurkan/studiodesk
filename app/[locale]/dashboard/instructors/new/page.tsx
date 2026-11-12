import { InstructorForm } from '@/components/instructors/InstructorForm'

export default function NewInstructorPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-muted/50 to-white p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <InstructorForm />
      </div>
    </div>
  )
}
