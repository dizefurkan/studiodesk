'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getInstructorsAndBranchesAndDanceTypes } from '@/lib/actions/instructor-rates.actions'
import { AddInstructorRateDrawer } from '@/components/instructor-rates/AddInstructorRateDrawer'

export default function NewInstructorRatePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getInstructorsAndBranchesAndDanceTypes()
      setData(result.data)
      setLoading(false)
    }
    load()
  }, [])

  const handleClose = () => {
    setLoading(true)
    setTimeout(() => {
      router.push('/dashboard/instructor-rates')
    }, 300)
  }

  if (loading) {
    return null
  }

  return (
    <AddInstructorRateDrawer
      instructors={data?.instructors || []}
      branches={data?.branches || []}
      danceTypes={data?.danceTypes || []}
      isOpen={true}
      onOpenChange={handleClose}
    />
  )
}
