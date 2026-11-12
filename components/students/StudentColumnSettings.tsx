'use client'

import { RotateCcw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StudentColumns } from '@/hooks/useStudentColumns'

interface StudentColumnSettingsProps {
  columns: StudentColumns
  onToggle: (column: keyof StudentColumns) => void
  onReset: () => void
}

const LABELS: Record<keyof StudentColumns, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  credits: 'Credits',
  courses: 'Courses',
  joined: 'Joined Date',
  actions: 'Actions',
}

export function StudentColumnSettings({ columns, onToggle, onReset }: StudentColumnSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Settings /> Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
        {(Object.keys(LABELS) as Array<keyof StudentColumns>).map((column) => (
          <DropdownMenuCheckboxItem
            key={column}
            checked={columns[column]}
            // name & actions can't be hidden
            disabled={(column === 'name' || column === 'actions') && columns[column]}
            onCheckedChange={() => onToggle(column)}
            onSelect={(e) => e.preventDefault()}
          >
            {LABELS[column]}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onReset}>
          <RotateCcw /> Reset to Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
