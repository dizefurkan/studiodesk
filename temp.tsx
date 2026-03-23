'use client'

import { useEffect, useState } from 'react'
import { getInstructorsAndBranchesAndDanceTypes } from '@/lib/actions/instructor-rates.actions'
import { AddInstructorRateDrawer } from '@/components/instructor-rates/AddInstructorRateDrawer'

export default function NewInstructorRatePage() {
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
