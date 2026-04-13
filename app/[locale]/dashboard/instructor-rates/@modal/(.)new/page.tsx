'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getInstructorsAndBranchesAndDanceTypes, getInstructorRates } from '@/lib/actions/instructor-rates.actions'
import { AddInstructorRateDrawer } from '@/components/instructor-rates/AddInstructorRateDrawer'

export default function NewInstructorRatePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [dataResult, ratesResult] = await Promise.all([
        getInstructorsAndBranchesAndDanceTypes(),
        getInstructorRates(),
      ])
      setData(dataResult.data)
      setRates(ratesResult.data || [])
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
      rates={rates}
      isOpen={true}
      onOpenChange={handleClose}
    />
  )
}
