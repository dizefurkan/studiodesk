'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getInstructorRates, getInstructorsAndBranchesAndDanceTypes, getInstructorRate } from '@/lib/actions/instructor-rates.actions'
import { InstructorRatesTable } from '@/components/instructor-rates/InstructorRatesTable'
import { InstructorSelectionDrawer } from '@/components/instructor-rates/InstructorSelectionDrawer'
import { AddInstructorRateDrawer } from '@/components/instructor-rates/AddInstructorRateDrawer'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { DollarSign } from 'lucide-react'

export default function InstructorRatesPage() {
  const t = useTranslations()
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [drawerData, setDrawerData] = useState<any>(null)
  const [editingRate, setEditingRate] = useState<any>(null)
  
  // Local state instead of useSearchParams (avoid extra dependency triggers)
  const [modalType, setModalType] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null)

  // Load rates and drawer data - fetch once on mount
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      const [ratesResult, drawerDataResult] = await Promise.all([
        getInstructorRates(),
        getInstructorsAndBranchesAndDanceTypes()
      ])
      
      if (!isMounted) return
      
      if (ratesResult.error) {
        console.error('Error fetching rates:', ratesResult.error)
      }
      if (drawerDataResult.error) {
        console.error('Error fetching drawer data:', drawerDataResult.error)
      }
      setRates(ratesResult.data || [])
      setDrawerData(drawerDataResult.data)
      setLoading(false)
    }
    
    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  // Load editing rate if in edit mode
  useEffect(() => {
    if (modalType === 'edit' && editId) {
      setEditLoading(true)
      
      let isMounted = true
      
      async function loadEditingRate() {
        const result = await getInstructorRate(editId as string)
        if (isMounted) {
          setEditingRate(result.data)
          setEditLoading(false)
        }
      }
      
      loadEditingRate()

      return () => {
        isMounted = false
      }
    } else {
      setEditingRate(null)
      setEditLoading(false)
    }
  }, [modalType, editId])

  // Refresh rates after they're modified (instead of full page reload)
  const handleRatesChange = useCallback(async () => {
    const ratesResult = await getInstructorRates()
    setRates(ratesResult.data || [])
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setModalType(null)
    setEditId(null)
    setSelectedInstructor(null)
  }, [])

  const isSelectionDrawerOpen = modalType === 'new' && !selectedInstructor
  const isFormDrawerOpen = (modalType === 'new' && selectedInstructor) || modalType === 'edit'

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-[#4F46E5] hover:underline mb-4 inline-block">
          ← {t('common.back')} to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-[#111827]">{t('instructorRates.title')}</h1>
        <p className="text-gray-600 mt-1">{t('instructorRates.description')}</p>
      </div>

      <Card className="border-[#E5E7EB] p-6 bg-linear-to-r from-amber-50 to-orange-50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <DollarSign className="text-orange-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#111827]">{t('instructorRates.aboutTitle')}</h3>
            <p className="text-sm text-gray-600 mt-2">
              {t('instructorRates.aboutDescription')}
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-3 space-y-1">
              <li>{t('instructorRates.specificToInstructor')}</li>
              <li>{t('instructorRates.earnAutomatically')}</li>
              <li>{t('instructorRates.multipleRates')}</li>
            </ul>
          </div>
        </div>
      </Card>

      <InstructorRatesTable rates={rates} onRatesChange={handleRatesChange} />

      {/* Instructor Selection Drawer (for 'new' modal without instructor selected) */}
      {!loading && drawerData && modalType === 'new' && !selectedInstructor && (
        <InstructorSelectionDrawer
          instructors={drawerData.instructors || []}
          isOpen={true}
          onOpenChange={handleCloseDrawer}
        />
      )}

      {/* Rate Form Drawer (for 'new' with instructor selected, or 'edit' mode) */}
      {!loading && drawerData && ((modalType === 'new' && selectedInstructor) || modalType === 'edit') && !editLoading && (
        <AddInstructorRateDrawer
          instructors={drawerData.instructors || []}
          branches={drawerData.branches || []}
          danceTypes={drawerData.danceTypes || []}
          isOpen={true}
          onOpenChange={handleCloseDrawer}
          initialRate={editingRate}
        />
      )}
    </div>
  )
}
