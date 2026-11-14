'use client'

import { useRouter } from '@/i18n/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Check, CircleAlert, Plus, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getStudentsWithPackages } from '@/lib/actions/students.actions'
import { addStudentToCourse } from '@/lib/actions/course-students.actions'

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  student_packages?: Array<{
    id: string
    remaining_credits: number
    package?: {
      dance_type_id: string
    }
  }>
}

interface AddStudentDialogProps {
  courseId: string
  danceTypeId: string
  enrolledStudentIds?: string[]
  onStudentsAdded?: () => void
}

export function AddStudentDialog({ courseId, danceTypeId, enrolledStudentIds = [], onStudentsAdded }: AddStudentDialogProps) {
  const tx = useTranslations('addStudentDialog')
  const t = useTranslations()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterHasPackage, setFilterHasPackage] = useState(true)
  const [loading, setLoading] = useState(false)
  const [addingStudents, setAddingStudents] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load students when dialog opens
  useEffect(() => {
    if (!isOpen) return

    const loadStudents = async () => {
      setLoading(true)
      setError(null)

      const result = await getStudentsWithPackages()

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setStudents(result.data)
      }

      setLoading(false)
    }

    loadStudents()
  }, [isOpen])

  // Filter students based on search and package filter
  useEffect(() => {
    let filtered = students

    // Exclude already enrolled students
    filtered = filtered.filter((s) => !enrolledStudentIds.includes(s.id))

    // Handle search query
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Handle package filter
    if (filterHasPackage) {
      filtered = filtered.filter((s) =>
        s.student_packages?.some(
          (sp) =>
            sp.package?.dance_type_id === danceTypeId && sp.remaining_credits > 0,
        ),
      )
    }

    setFilteredStudents(filtered)
  }, [students, searchQuery, filterHasPackage, danceTypeId, enrolledStudentIds])

  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleAddStudents = async () => {
    if (selectedStudents.size === 0) {
      setError(tx('selectAtLeastOne'))
      return
    }

    setAddingStudents(true)
    setError(null)

    try {
      let successCount = 0
      let failureCount = 0

      for (const studentId of selectedStudents) {
        const result = await addStudentToCourse(courseId, studentId)
        if (result.success) {
          successCount++
        } else {
          failureCount++
        }
      }

      if (failureCount === 0) {
        setIsOpen(false)
        setSelectedStudents(new Set())
        onStudentsAdded?.()
        // Don't use router.refresh() - let the Container handle the refresh via callback
      } else {
        setError(tx('partialResult', { added: successCount, failed: failureCount }))
      }
    } catch (err) {
      setError(tx('addFailed'))
      console.error(err)
    } finally {
      setAddingStudents(false)
    }
  }

  const hasPackageCount = students.filter((s) =>
    s.student_packages?.some(
      (sp) =>
        sp.package?.dance_type_id === danceTypeId && sp.remaining_credits > 0,
    ),
  ).length

  const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.has(s.id))
  const toggleAllVisible = () => {
    const next = new Set(selectedStudents)
    if (allVisibleSelected) filteredStudents.forEach((s) => next.delete(s.id))
    else filteredStudents.forEach((s) => next.add(s.id))
    setSelectedStudents(next)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t('courses.addStudents')}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('courses.addStudentsTitle')}</DialogTitle>
          <DialogDescription>
            {hasPackageCount} student{hasPackageCount !== 1 ? 's' : ''} with active packages for this dance type
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder={tx('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Field orientation="horizontal">
            <Checkbox
              id="filter-has-package"
              checked={filterHasPackage}
              onCheckedChange={(c) => setFilterHasPackage(c === true)}
            />
            <FieldLabel htmlFor="filter-has-package" className="font-normal">
              {tx('activeOnly')}
            </FieldLabel>
          </Field>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Spinner /> {tx('loading')}
            </div>
          ) : filteredStudents.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  {filterHasPackage && students.filter((s) => !enrolledStudentIds.includes(s.id)).length === 0
                    ? tx('noneAvailable')
                    : tx('noneFound')}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label={tx('selectAll')} />
                  </TableHead>
                  <TableHead>{tx('name')}</TableHead>
                  <TableHead>{tx('email')}</TableHead>
                  <TableHead>{tx('credits')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const pkg = student.student_packages?.find(
                    (sp) => sp.package?.dance_type_id === danceTypeId && sp.remaining_credits > 0
                  )
                  return (
                    <TableRow key={student.id} data-state={selectedStudents.has(student.id) ? 'selected' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() => handleStudentSelect(student.id)}
                          aria-label={`${student.first_name} ${student.last_name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>
                        {pkg ? (
                          <Badge className="bg-green-100 text-green-700">{pkg.remaining_credits}</Badge>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={addingStudents}>
              {tx('cancel')}
            </Button>
            <Button onClick={handleAddStudents} disabled={selectedStudents.size === 0 || addingStudents}>
              {addingStudents ? <Spinner /> : <Check />}
              {addingStudents
                ? tx('adding')
                : tx('addCount', { count: selectedStudents.size })}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
