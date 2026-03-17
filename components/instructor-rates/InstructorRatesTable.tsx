'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'
import { createInstructorRate, updateInstructorRate, deleteInstructorRate } from '@/lib/actions/instructor-rates.actions'
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

interface InstructorRatesTableProps {
  rates: InstructorRate[]
  instructors: Instructor[]
  branches: Branch[]
  danceTypes: DanceType[]
}

export function InstructorRatesTable({
  rates,
  instructors,
  branches,
  danceTypes,
}: InstructorRatesTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    instructorId: '',
    branchId: '',
    danceTypeId: '',
    price: '' as string,
  })

  const handleDelete = async (rateId: string) => {
    if (!confirm('Delete this rate?')) return

    setLoading(true)
    try {
      const result = await deleteInstructorRate(rateId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError('Failed to delete rate')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.instructorId || !formData.branchId || !formData.danceTypeId || !formData.price) {
      setError('All fields are required')
      return
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setError('Price must be a valid positive number')
      return
    }

    setLoading(true)
    try {
      let result
      if (editingId) {
        result = await updateInstructorRate(editingId, price)
      } else {
        result = await createInstructorRate(
          formData.instructorId,
          formData.branchId,
          formData.danceTypeId,
          price,
        )
      }

      if (result.error) {
        setError(result.error)
      } else {
        setFormData({ instructorId: '', branchId: '', danceTypeId: '', price: '' })
        setShowForm(false)
        setEditingId(null)
        router.refresh()
      }
    } catch (err) {
      setError('Failed to save rate')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (rate: InstructorRate) => {
    setFormData({
      instructorId: rate.instructors.id,
      branchId: rate.branches.id,
      danceTypeId: rate.dance_types.id,
      price: rate.price_per_class.toString(),
    })
    setEditingId(rate.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setFormData({ instructorId: '', branchId: '', danceTypeId: '', price: '' })
    setShowForm(false)
    setEditingId(null)
    setError('')
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      {showForm && (
        <Card className="border-[#E5E7EB] p-6 bg-blue-50">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">
            {editingId ? 'Edit Rate' : 'Add New Rate'}
          </h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Instructor *
                </label>
                <select
                  value={formData.instructorId}
                  onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  disabled={!!editingId}
                  className="w-full border border-[#D1D5DB] rounded px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] disabled:bg-gray-100"
                >
                  <option value="">Select instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Branch *
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  disabled={!!editingId}
                  className="w-full border border-[#D1D5DB] rounded px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] disabled:bg-gray-100"
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Dance Type *
                </label>
                <select
                  value={formData.danceTypeId}
                  onChange={(e) => setFormData({ ...formData, danceTypeId: e.target.value })}
                  disabled={!!editingId}
                  className="w-full border border-[#D1D5DB] rounded px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] disabled:bg-gray-100"
                >
                  <option value="">Select dance type</option>
                  {danceTypes.map((danceType) => (
                    <option key={danceType.id} value={danceType.id}>
                      {danceType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Price per Class (₺) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="border-[#D1D5DB]"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="border-[#D1D5DB]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                {loading ? 'Saving...' : editingId ? 'Update Rate' : 'Add Rate'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Add Button */}
      {!showForm && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-2"
          >
            <Plus size={18} />
            Add Rate
          </Button>
        </div>
      )}

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
                        onClick={() => handleEdit(rate)}
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
