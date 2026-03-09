import { getPackage } from '@/lib/actions/packages.actions'
import { notFound } from 'next/navigation'
import { PackageForm } from '@/components/packages/PackageForm'

interface EditPackagePageProps {
  params: {
    id: string
  }
}

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  const { id } = await params
  const result = await getPackage(id)

  if (result.error) {
    notFound()
  }

  const pkg = result.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <PackageForm package={pkg} />
    </div>
  )
}
