'use client'

import { useEffect, useState } from 'react'
import { getInstructorsAndBranchesAndDanceTypes, getInstructorRate } from '@/lib/actions/instructor-rates.actions'
import { AddInstructorRateDrawer } from '@/components/instructor-rates/AddInstructorRateDrawer'

interface EditInstructorRatePageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditInstructorRatePage({ params }: EditInstructorRatePageProps) {
  const [id, setId] = useState<string>('')
  const [data, setData] = useState<any>(null)
  const [rate, setRate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!id) return

    async function load() {
      const [dataResult, rateResult] = await Promise.all([
        getInstructorsAndBranchesAndDanceTypes(),
        getInstructorRate(id),
      ])

      setData(dataResult.data)

      const rateData = rateResult.data
      if (rateData) {
        const transformedRate = {
          id: rateData.id,
          price_per_class: rateData.price_per_class,
          instructors: {
            id: rateData.instructor_id,
            first_name: rateData.first_name,
            last_name: rateData.last_name,
          },
          branches: {
            id: rateData.branch_id,
            name: rateData.branch_name,
          },
          dance_types: {
            id: rateData.dance_type_id,
            name: rateData.dance_type_name,
          },
        }
        setRate(transformedRate)
      }

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return null
  }

  return (
    <AddInstructorRateDrawer
      instructors={data?.instructors || []}
      branches={data?.branches || []}
      danceTypes={data?.danceTypes || []}
      isOpen={true}
      onOpenChange={() => {}}
      initialRate={rate}
    />
  )
}
