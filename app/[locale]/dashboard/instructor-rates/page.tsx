'use client'

import { Link } from '@/i18n/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getInstructorRates, getInstructorsAndBranchesAndDanceTypes, getInstructorRate } from '@/lib/actions/instructor-rates.actions'
import { InstructorRatesTable } from '@/components/instructor-rates/InstructorRatesTable'
import { AddInstructorRateDrawer } from '@/components/instructor-rates/AddInstructorRateDrawer'
import { Card } from '@/components/ui/card'
import { Info, Plus } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import type { ActionData } from '@/lib/types/actions'

export default function InstructorRatesPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const [rates, setRates] = useState<ActionData<typeof getInstructorRates>>([])
  const [loading, setLoading] = useState(true)
  const [drawerData, setDrawerData] = useState<ActionData<typeof getInstructorsAndBranchesAndDanceTypes> | null>(null)
  // Rate loaded for the edit drawer, keyed by id so a stale one is never shown
  const [loadedRate, setLoadedRate] = useState<{ id: string; data: ActionData<typeof getInstructorRate> | null } | null>(null)

  // Local state, initialised from the URL (?modal=new|edit&editId=…)
  const [modalType, setModalType] = useState<string | null>(() => searchParams?.get('modal') ?? null)
  const [editId, setEditId] = useState<string | null>(() => searchParams?.get('editId') ?? null)
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
      setDrawerData(drawerDataResult.data ?? null)
      setLoading(false)
    }
    
    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const isEditing = modalType === 'edit' && !!editId
  const editingRate = isEditing && loadedRate?.id === editId ? loadedRate.data : null
  const editLoading = isEditing && loadedRate?.id !== editId

  // Load editing rate if in edit mode
  useEffect(() => {
    if (modalType !== 'edit' || !editId) return
    let isMounted = true
    getInstructorRate(editId).then((result) => {
      if (isMounted) setLoadedRate({ id: editId, data: result.data ?? null })
    })
    return () => {
      isMounted = false
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
          initialRate={editingRate ?? undefined}
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
