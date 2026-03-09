'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingCart, AlertCircle } from 'lucide-react'
import { purchasePackage } from '@/lib/actions/students.actions'
import { useRouter } from 'next/navigation'

interface StudentPurchaseDialogProps {
  studentId: string
  packages: Array<{
    id: string
    name: string
    total_credits: number
    price: number
    dance_types?: { name: string } | null
  }>
}

export function StudentPurchaseDialog({ studentId, packages }: StudentPurchaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [customPrice, setCustomPrice] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const selectedPackage = packages.find((p) => p.id === selectedPackageId)

  const handlePurchase = async () => {
    if (!selectedPackageId) {
      setError('Please select a package')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await purchasePackage({
        studentId,
        packageId: selectedPackageId,
        price: customPrice ? parseFloat(customPrice) : undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
        setSelectedPackageId('')
        setCustomPrice('')
        router.refresh()
      }
    } catch (err) {
      setError('Failed to process purchase')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2">
        <ShoppingCart size={16} />
        Purchase Package
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg border-[#E5E7EB]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-[#4F46E5]" size={24} />
              <h2 className="text-2xl font-bold text-[#111827]">Purchase Package</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#6B7280] hover:text-[#111827] text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Package Selection */}
          <div className="pb-4 border-b border-[#E5E7EB]">
            <Label className="text-sm font-semibold text-[#111827] mb-3 block">Select Package</Label>
            <div className="space-y-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPackageId(pkg.id)
                    setCustomPrice('')
                  }}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    selectedPackageId === pkg.id
                      ? 'border-[#4F46E5] bg-[#EEF2FF]'
                      : 'border-[#E5E7EB] hover:border-[#4F46E5]'
                  }`}
                >
                  <p className="font-semibold text-[#111827]">{pkg.name}</p>
                  <p className="text-sm text-[#6B7280]">
                    {pkg.total_credits} credits • {pkg.dance_types?.name}
                  </p>
                  <p className="text-sm font-medium text-[#4F46E5] mt-1">Price: {pkg.price} TL</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price Override */}
          {selectedPackage && (
            <div className="py-4 border-b border-[#E5E7EB]">
              <Label htmlFor="custom-price" className="text-sm font-semibold text-[#111827] block mb-2">
                Price (optional override)
              </Label>
              <Input
                id="custom-price"
                type="number"
                placeholder={`${selectedPackage.price} TL`}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="border-[#E5E7EB] focus:border-[#4F46E5]"
              />
              <p className="text-xs text-[#6B7280] mt-1">Leave empty to use package price</p>
            </div>
          )}

          {/* Summary */}
          {selectedPackage && (
            <div className="py-4 bg-[#F9FAFB] rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7280]">Package:</span>
                <span className="font-medium text-[#111827]">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7280]">Credits:</span>
                <span className="font-medium text-[#111827]">{selectedPackage.total_credits}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
                <span className="text-sm font-semibold text-[#111827]">Total:</span>
                <span className="font-bold text-[#4F46E5] text-lg">
                  {customPrice || selectedPackage.price} TL
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-[#E5E7EB] text-[#111827]"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={!selectedPackageId || loading}
              className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {loading ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
