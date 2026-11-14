'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Instructor {
  id: string
  first_name: string
  last_name: string
}

interface InstructorRate {
  instructor_id: string
  dance_type_id: string
  ratio_per_class: number
}

interface InstructorSelectorProps {
  instructors: Instructor[]
  allInstructors?: Instructor[]
  instructorRates?: InstructorRate[]
  danceTypeId?: string
  editingInstructorId?: string
  selectedReplacementId?: string
  instructorOverrides?: Record<string, string>
  onSave: (replacementId: string) => void
  onClose: () => void
}

const ITEMS_PER_PAGE = 10

export function InstructorSelector({
  instructors,
  allInstructors,
  instructorRates,
  danceTypeId,
  editingInstructorId,
  selectedReplacementId,
  instructorOverrides = {},
  onSave,
  onClose,
}: InstructorSelectorProps) {
  const tx = useTranslations('instructorSelector')
  const t = useTranslations()
  const [tempSelectedId, setTempSelectedId] = useState<string>(selectedReplacementId || '')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  // Filter: Show only instructors NOT in the course and NOT already selected as overrides
  const courseInstructorIds = new Set(instructors.map((i) => i.id))
  const usedOverrideIds = new Set(
    Object.entries(instructorOverrides)
      .filter(([key]) => key !== editingInstructorId) // Exclude current override
      .map(([, value]) => value)
  )
  
  const availableInstructors = (allInstructors || []).filter(
    (instructor) => !courseInstructorIds.has(instructor.id) && !usedOverrideIds.has(instructor.id)
  )

  const editingInstructor = instructors.find((i) => i.id === editingInstructorId)

  // Filter by search query
  const filteredInstructors = useMemo(() => {
    return availableInstructors.filter((instructor) => {
      const fullName = `${instructor.first_name} ${instructor.last_name}`.toLowerCase()
      return fullName.includes(searchQuery.toLowerCase())
    })
  }, [availableInstructors, searchQuery])

  // Paginate
  const totalPages = Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedInstructors = filteredInstructors.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleSave = () => {
    onSave(tempSelectedId)
  }

  // Check if instructor has rate for this dance type
  const hasRate = (instructorId: string) => {
    if (!instructorRates || !danceTypeId) return true
    return instructorRates.some(
      (rate) => rate.instructor_id === instructorId && rate.dance_type_id === danceTypeId
    )
  }

  // Get rate amount for this dance type
  const getRateAmount = (instructorId: string) => {
    if (!instructorRates || !danceTypeId) return null
    const rate = instructorRates.find(
      (rate) => rate.instructor_id === instructorId && rate.dance_type_id === danceTypeId
    )
    return rate?.ratio_per_class ?? null
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {tx('replaceTitle', { name: `${editingInstructor?.first_name ?? ''} ${editingInstructor?.last_name ?? ''}`.trim() })}
          </DialogTitle>
          <DialogDescription>
            {tx('replaceDescription', { name: editingInstructor?.first_name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder={tx('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </InputGroup>

        <RadioGroup
          value={tempSelectedId ?? ''}
          onValueChange={setTempSelectedId}
          className="block min-h-0 flex-1 overflow-y-auto rounded-lg border"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t('table.select')}</TableHead>
                <TableHead>{t('table.instructorName')}</TableHead>
                <TableHead>{t('table.rateStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInstructors.length > 0 ? (
                paginatedInstructors.map((instructor) => {
                  const rateExists = hasRate(instructor.id)
                  const rateAmount = getRateAmount(instructor.id)
                  const id = `replace-${instructor.id}`
                  return (
                    <TableRow
                      key={instructor.id}
                      data-state={tempSelectedId === instructor.id ? 'selected' : undefined}
                      className="cursor-pointer"
                      onClick={() => setTempSelectedId(instructor.id)}
                    >
                      <TableCell>
                        <RadioGroupItem value={instructor.id} id={id} />
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={id} className="cursor-pointer">
                          {instructor.first_name} {instructor.last_name}
                        </Label>
                      </TableCell>
                      <TableCell>
                        {rateExists ? (
                          <Badge className="bg-green-100 text-green-700">
                            {tx('hasRate')} {rateAmount !== null && `(%${rateAmount})`}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">{tx('noRate')}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    {availableInstructors.length === 0
                      ? tx('noneAvailable')
                      : tx('noMatch')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </RadioGroup>

        {filteredInstructors.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {tx('pageInfo', { page: currentPage, pages: totalPages, shown: paginatedInstructors.length, total: filteredInstructors.length })}
            </span>
            <div className="flex gap-2">
              <Button onClick={handlePreviousPage} disabled={currentPage === 1} variant="outline" size="sm">
                {tx('previous')}
              </Button>
              <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline" size="sm">
                {tx('next')}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            {tx('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!tempSelectedId}>
            {tx('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
