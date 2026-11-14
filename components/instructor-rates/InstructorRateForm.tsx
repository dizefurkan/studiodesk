'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createInstructorRate, updateInstructorRate } from '@/lib/actions/instructor-rates.actions'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'

interface Instructor {
  id: string
  first_name: string
  last_name: string
}

interface Branch {
  id: string
  name: string
}

interface DanceType {
  id: string
  name: string
}

interface InstructorRate {
  id: string
  ratio_per_class: number
  instructors: Instructor
  branches: Branch
  dance_types: DanceType
}

interface InstructorRateFormProps {
  instructors: Instructor[]
  branches: Branch[]
  danceTypes: DanceType[]
  rates: InstructorRate[]
  initialRate?: InstructorRate
  selectedInstructorId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function InstructorRateForm({
  instructors,
  branches,
  danceTypes,
  rates,
  initialRate,
  selectedInstructorId,
  onSuccess,
  onCancel,
}: InstructorRateFormProps) {
  const tx = useTranslations('instructorRateForm')
  const tf = useTranslations('forms')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    instructorId: initialRate?.instructors.id || selectedInstructorId || '',
    branchId: initialRate?.branches.id || '',
    danceTypeId: initialRate?.dance_types.id || '',
    ratio: initialRate?.ratio_per_class.toString() || '',
  })

  // Update form data when initialRate or selectedInstructorId changes
  useEffect(() => {
    if (initialRate) {
      setFormData({
        instructorId: initialRate.instructors?.id || '',
        branchId: initialRate.branches?.id || '',
        danceTypeId: initialRate.dance_types?.id || '',
        ratio: initialRate.ratio_per_class?.toString() || '',
      })
    } else if (selectedInstructorId) {
      setFormData((prev) => ({
        ...prev,
        instructorId: selectedInstructorId,
      }))
    }
  }, [initialRate, selectedInstructorId])

  // Reset dance type when branch changes
  useEffect(() => {
    if (!initialRate) {
      setFormData((prev) => ({
        ...prev,
        danceTypeId: '',
      }))
    }
  }, [formData.branchId, initialRate])

  // Get unavailable dance types for the selected instructor + branch
  const getUnavailableDanceTypeIds = () => {
    if (!formData.instructorId || !formData.branchId || initialRate) {
      // When editing, allow all dance types (keep the selected one)
      return []
    }
    
    return rates
      .filter(
        (rate) =>
          rate.instructors.id === formData.instructorId &&
          rate.branches.id === formData.branchId
      )
      .map((rate) => rate.dance_types.id)
  }

  const unavailableDanceTypeIds = getUnavailableDanceTypeIds()
  const availableDanceTypes = danceTypes.filter(
    (danceType) => !unavailableDanceTypeIds.includes(danceType.id)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.instructorId || !formData.branchId || !formData.danceTypeId || !formData.ratio) {
      setError(tx('allRequired'))
      return
    }

    const ratio = parseFloat(formData.ratio)
    if (isNaN(ratio) || ratio <= 0 || ratio > 100) {
      setError(tx('ratioRange'))
      return
    }

    setLoading(true)
    try {
      let result
      if (initialRate) {
        result = await updateInstructorRate(initialRate.id, ratio)
      } else {
        result = await createInstructorRate(
          formData.instructorId,
          formData.branchId,
          formData.danceTypeId,
          ratio,
        )
      }

      if (result.error) {
        setError(result.error)
      } else {
        onSuccess?.()
      }
    } catch (err) {
      setError(tx('saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      instructorId: initialRate?.instructors.id || '',
      branchId: initialRate?.branches.id || '',
      danceTypeId: initialRate?.dance_types.id || '',
      ratio: initialRate?.ratio_per_class.toString() || '',
    })
    setError('')
    onCancel?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      {error && (
        <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs sm:text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
        <div>
          <Label className="block mb-2">
            {tx('instructor')}
          </Label>
          <NativeSelect
            value={formData.instructorId}
            onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
            disabled={!!initialRate || !!selectedInstructorId}
            className="w-full"
          >
            <NativeSelectOption value="">{tx('selectInstructor')}</NativeSelectOption>
            {instructors.map((instructor) => (
              <NativeSelectOption key={instructor.id} value={instructor.id}>
                {instructor.first_name} {instructor.last_name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div>
          <Label className="block mb-2">
            {tx('branch')}
          </Label>
          <NativeSelect
            value={formData.branchId}
            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            disabled={!!initialRate}
            className="w-full"
          >
            <NativeSelectOption value="">{tx('selectBranch')}</NativeSelectOption>
            {branches.map((branch) => (
              <NativeSelectOption key={branch.id} value={branch.id}>
                {branch.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div>
          <Label className="block mb-2">
            {tx('danceType')}
          </Label>
          <NativeSelect
            value={formData.danceTypeId}
            onChange={(e) => setFormData({ ...formData, danceTypeId: e.target.value })}
            disabled={!!initialRate || !formData.branchId}
            className="w-full"
          >
            <NativeSelectOption value="">{tx('selectDanceType')}</NativeSelectOption>
            {availableDanceTypes.map((danceType) => (
              <NativeSelectOption key={danceType.id} value={danceType.id}>
                {danceType.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div>
          <Label className="block mb-2">
            {tx('ratio')}
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.ratio}
            onChange={(e) => setFormData({ ...formData, ratio: e.target.value })}
            placeholder="0.00"
            className="border-input"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="border-input text-sm md:text-base h-9 md:h-10"
        >
          {tf('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="text-sm md:text-base h-9 md:h-10"
        >
          {loading ? tf('saving') : initialRate ? tx('update') : tx('add')}
        </Button>
      </div>
    </form>
  )
}
