'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { InstructorRateForm } from './InstructorRateForm'

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
  price_per_class: number
  instructors: Instructor
  branches: Branch
  dance_types: DanceType
}

interface AddInstructorRateDrawerProps {
  instructors: Instructor[]
  branches: Branch[]
  danceTypes: DanceType[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialRate?: InstructorRate
}

export function AddInstructorRateDrawer({
  instructors,
  branches,
  danceTypes,
  isOpen,
  onOpenChange,
  initialRate,
}: AddInstructorRateDrawerProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onOpenChange(false)
    }, 300)
  }

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setIsAnimating(false)
      // Use requestAnimationFrame to ensure the browser paints the initial state first
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    }
  }, [isOpen])

  const handleSuccess = () => {
    setIsClosing(true)
    setTimeout(() => {
      onOpenChange(false)
      window.location.reload()
    }, 300)
  }

  const handleCancel = () => {
    setIsClosing(true)
    // Animate close then navigate
    setTimeout(() => {
      router.push('/dashboard/instructor-rates')
    }, 300)
  }

  if (!isOpen && !isClosing) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-out ${
          isClosing || !isAnimating ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-96 bg-white z-50 shadow-lg overflow-y-auto transition-all duration-300 ease-out ${
          isClosing || !isAnimating ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111827]">
              {initialRate ? 'Edit Rate' : 'Add New Rate'}
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <InstructorRateForm
            instructors={instructors}
            branches={branches}
            danceTypes={danceTypes}
            initialRate={initialRate}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </>
  )
}
