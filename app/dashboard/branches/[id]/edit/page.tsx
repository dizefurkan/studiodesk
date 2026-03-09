import { getBranch } from '@/lib/actions/branches.actions'
import { notFound } from 'next/navigation'
import { BranchForm } from '@/components/branches/BranchForm'

interface EditBranchPageProps {
  params: {
    id: string
  }
}

export default async function EditBranchPage({ params }: EditBranchPageProps) {
  const result = await getBranch(params.id)

  if (result.error) {
    notFound()
  }

  const branch = result.data

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <BranchForm branch={branch} />
    </div>
  )
}
