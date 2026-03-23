'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'
import { deleteInstructorRate } from '@/lib/actions/instructor-rates.actions'
import { useRouter } from 'next/navigation'

interface InstructorRate {
  id: string
  price_per_class: number
  instructors: {
    id: string
    first_name: string
    last_name: string
  }
  branches: {
    id: string
    name: string
  }
  dance_types: {
    id: string
    name: string
  }
}

interface InstructorRatesTableProps {
  rates: InstructorRate[]
  onRatesChange?: () => void
}

export function InstructorRatesTable({
  rates,
  onRatesChange
}: InstructorRatesTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async (rateId: string) => {
    if (!confirm('Delete this rate?')) return

    setLoading(true)
    try {
      const result = await deleteInstructorRate(rateId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert('Failed to delete rate')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDrawer = (rate?: InstructorRate) => {
    if (rate) {
      // Edit mode
      router.push(`/dashboard/instructor-rates?modal=edit&id=${rate.id}`)
    } else {
      // New rate mode
      router.push('/dashboard/instructor-rates?modal=new')
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => handleOpenDrawer()}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2"
        >
          <Plus size={18} />
          Add Rate
        </Button>
      </div>

      {/* Rates Table */}
      {rates.length === 0 ? (
        <Card className="border-[#E5E7EB] p-12 text-center">
          <p className="text-gray-500">No instructor rates configured yet</p>
          <p className="text-sm text-gray-400 mt-1">Add rates to calculate instructor earnings</p>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#111827]">
                    Dance Type
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#111827]">
                    Price per Class
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-[#111827]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#111827]">
                      {rate.instructors.first_name} {rate.instructors.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{rate.branches.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{rate.dance_types.name}</td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-[#111827]">
                      ₺{Number(rate.price_per_class).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDrawer(rate)}
                        disabled={loading}
                        className="px-3 py-1 text-sm text-[#4F46E5] hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rate.id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 inline-flex"
                        title="Delete rate"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
