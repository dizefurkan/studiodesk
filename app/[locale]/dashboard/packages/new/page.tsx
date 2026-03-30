import { PackageForm } from '@/components/packages/PackageForm'

export default function NewPackagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <PackageForm />
      </div>
    </div>
  )
}
