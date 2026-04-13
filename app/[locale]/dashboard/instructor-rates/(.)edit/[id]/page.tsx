'use client'

import { useEffect, useState } from 'react'
import { getInstructorsAndBranchesAndDanceTypes, getInstructorRate, getInstructorRates } from '@/lib/actions/instructor-rates.actions'
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
  const [rates, setRates] = useState<any[]>([])
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
      const [dataResult, rateResult, ratesResult] = await Promise.all([
        getInstructorsAndBranchesAndDanceTypes(),
        getInstructorRate(id),
        getInstructorRates(),
      ])

      setData(dataResult.data)
      setRates(ratesResult.data || [])

      const rateData = rateResult.data
      if (rateData) {
        setRate(rateData)
      }

      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return <div className="fixed inset-0 bg-black/50 z-40" />
  }

  return (
    <AddInstructorRateDrawer
      instructors={data?.instructors || []}
      branches={data?.branches || []}
      danceTypes={data?.danceTypes || []}
      rates={rates}
      isOpen={true}
      onOpenChange={() => {}}
      initialRate={rate}
    />
  )
}
