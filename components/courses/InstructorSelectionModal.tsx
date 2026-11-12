'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

interface Instructor {
  id: string
  first_name: string
  last_name: string
  instructor_rates?: Array<{
    id: string
    ratio_per_class: number
    branch_id: string
    dance_type_id: string
  }>
}

interface InstructorSelectionModalProps {
  instructors: Instructor[]
  selectedIds: string[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (instructorIds: string[]) => void
  danceTypeName?: string
}

export function InstructorSelectionModal({
  instructors,
  selectedIds,
  isOpen,
  onOpenChange,
  onSelect,
  danceTypeName,
}: InstructorSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelected, setTempSelected] = useState<string[]>(selectedIds)

  // reset the working selection every time the dialog opens
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen)
    if (isOpen) setTempSelected(selectedIds)
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return instructors
    return instructors.filter((i) => `${i.first_name} ${i.last_name}`.toLowerCase().includes(q))
  }, [instructors, searchQuery])

  const toggle = (id: string, checked: boolean) =>
    setTempSelected((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)))

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Instructors</DialogTitle>
          {danceTypeName && <DialogDescription>for {danceTypeName}</DialogDescription>}
        </DialogHeader>

        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  {instructors.length === 0
                    ? 'No instructors available for this dance type'
                    : 'No instructors found matching your search'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <FieldGroup className="gap-2">
              {filtered.map((instructor) => {
                const ratio = instructor.instructor_rates?.[0]?.ratio_per_class
                const id = `instructor-${instructor.id}`
                return (
                  <FieldLabel key={instructor.id} htmlFor={id}>
                    <Field orientation="horizontal">
                      <Checkbox
                        id={id}
                        checked={tempSelected.includes(instructor.id)}
                        onCheckedChange={(c) => toggle(instructor.id, c === true)}
                      />
                      <FieldContent>
                        <span className="text-sm font-medium">
                          {instructor.first_name} {instructor.last_name}
                        </span>
                      </FieldContent>
                      {ratio !== undefined && <Badge variant="secondary">%{ratio}</Badge>}
                    </Field>
                  </FieldLabel>
                )
              })}
            </FieldGroup>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSelect(tempSelected)
              onOpenChange(false)
            }}
          >
            Confirm ({tempSelected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
