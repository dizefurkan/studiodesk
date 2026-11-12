'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getInstructorRates, getInstructorsAndBranchesAndDanceTypes, getInstructorRate } from '@/lib/actions/instructor-rates.actions'
import { InstructorRatesTable } from '@/components/instructor-rates/InstructorRatesTable'
import { AddInstructorRateDrawer } from '@/components/instructor-rates/AddInstructorRateDrawer'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Info, Plus } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

export default function InstructorRatesPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [drawerData, setDrawerData] = useState<any>(null)
  const [editingRate, setEditingRate] = useState<any>(null)
  
  // Local state with URL param initialization
  const [modalType, setModalType] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null)

  // Initialize modal from URL params
  useEffect(() => {
    const modal = searchParams?.get('modal')
    const editIdParam = searchParams?.get('editId')
    
    if (modal) {
      setModalType(modal)
    }
    if (editIdParam) {
      setEditId(editIdParam)
    }
  }, [searchParams])

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

  const handleOpenNew = useCallback(() => {
    setModalType('new')
    setSelectedInstructor(null)
    setEditId(null)
  }, [])

  const handleOpenNewForInstructor = useCallback((instructorId: string) => {
    setModalType('new')
    setSelectedInstructor(instructorId)
    setEditId(null)
  }, [])

  const handleOpenEdit = useCallback((rateId: string) => {
    setModalType('edit')
    setEditId(rateId)
  }, [])

  const handleSelectInstructor = useCallback((instructorId: string) => {
    setSelectedInstructor(instructorId)
    // Form drawer will automatically show because modalType stays 'new' and selectedInstructor is now set
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
      <PageHeader title={t('instructorRates.title')} description={t('instructorRates.description')} />

      <Alert>
        <Info />
        <AlertTitle>{t('instructorRates.aboutTitle')}</AlertTitle>
        <AlertDescription>
          <p>{t('instructorRates.aboutDescription')}</p>
          <ul className="list-inside list-disc">
            <li>{t('instructorRates.specificToInstructor')}</li>
            <li>{t('instructorRates.earnAutomatically')}</li>
            <li>{t('instructorRates.multipleRates')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {!loading && (drawerData?.instructors || []).length === 0 ? (
        <EmptyState
          title={t('emptyStates.instructorRates.title')}
          description={t('emptyStates.instructorRates.description')}
          action={
            <Button asChild>
              <Link href="/dashboard/instructors/new">
                <Plus /> {t('instructors.addNew')}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="p-3 sm:p-4 md:p-6">
          <InstructorRatesTable
            rates={rates}
            instructors={drawerData?.instructors || []}
            onRatesChange={handleRatesChange}
            onOpenEdit={handleOpenEdit}
            onOpenNewForInstructor={handleOpenNewForInstructor}
          />
        </Card>
      )}

      {/* Rate Form Drawer (for 'new' with instructor selected, or 'edit' mode) */}
      {!loading && drawerData && ((modalType === 'new' && selectedInstructor) || modalType === 'edit') && !editLoading && (
        <AddInstructorRateDrawer
          instructors={drawerData.instructors || []}
          branches={drawerData.branches || []}
          danceTypes={drawerData.danceTypes || []}
          rates={rates}
          isOpen={true}
          onOpenChange={handleCloseDrawer}
          initialRate={editingRate}
          selectedInstructorId={modalType === 'new' && selectedInstructor ? selectedInstructor : undefined}
          onSuccess={() => {
            handleCloseDrawer()
            handleRatesChange()
          }}
        />
      )}
    </div>
  )
}
