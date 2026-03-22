'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Settings, X } from 'lucide-react'
import { StudentColumns } from '@/hooks/useStudentColumns'

interface StudentColumnSettingsProps {
  columns: StudentColumns
  onToggle: (column: keyof StudentColumns) => void
  onReset: () => void
}

export function StudentColumnSettings({
  columns,
  onToggle,
  onReset,
}: StudentColumnSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  const columnLabels: Record<keyof StudentColumns, string> = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    credits: 'Credits',
    courses: 'Courses',
    joined: 'Joined Date',
    actions: 'Actions',
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="border-[#E5E7EB]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings size={16} className="mr-2" />
        Columns
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <Card className="border-[#E5E7EB] p-4 w-56 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#111827]">Show Columns</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {(Object.keys(columnLabels) as Array<keyof StudentColumns>).map(
                (column) => (
                  <label
                    key={column}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={columns[column]}
                      onChange={() => onToggle(column)}
                      className="rounded"
                      disabled={
                        (column === 'name' || column === 'actions') &&
                        columns[column]
                      }
                    />
                    <span className="text-sm text-[#111827]">
                      {columnLabels[column]}
                    </span>
                  </label>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full border-[#E5E7EB] text-xs"
              onClick={() => {
                onReset()
                setIsOpen(false)
              }}
            >
              Reset to Default
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
