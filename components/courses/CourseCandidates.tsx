'use client'

import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Tag, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Spinner } from '@/components/ui/spinner'
import { getCourseCandidates } from '@/lib/actions/labels.actions'
import { addStudentToCourse } from '@/lib/actions/course-students.actions'
import type { ActionData } from '@/lib/types/actions'

type Candidates = ActionData<typeof getCourseCandidates>

/**
 * Active students who share a label (e.g. level) with the course but aren't in it:
 * invite them by message, or add them to the class directly.
 */
export function CourseCandidates({ courseId, onAdded }: { courseId: string; onAdded: () => void }) {
  const t = useTranslations('labels.candidates')
  const [result, setResult] = useState<Candidates | null>(null)
  const [loading, startLoading] = useTransition()
  const [adding, setAdding] = useState<string | null>(null)

  const load = () =>
    startLoading(async () => {
      const res = await getCourseCandidates(courseId)
      if (res.error) toast.error(res.error)
      setResult(res.data ?? { hasLabels: false, students: [] })
    })

  useEffect(load, [courseId])

  const add = async (studentId: string) => {
    setAdding(studentId)
    const res = await addStudentToCourse(courseId, studentId)
    setAdding(null)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(t('added'))
    load()
    onAdded()
  }

  const students = result?.students ?? []
  const reachable = students.filter((s) => s.phone && !s.optOut).length

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
        {reachable > 0 && (
          <CardAction>
            <Button asChild size="sm">
              <Link href={`/dashboard/messages?audience=course_invite&course=${courseId}&category=class_invite`}>
                <Send /> {t('invite', { count: reachable })}
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {loading && !result ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !result?.hasLabels ? (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Tag className="mt-0.5 size-4 shrink-0" /> {t('noLabels')}
          </p>
        ) : students.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ItemGroup className="divide-y divide-border">
            {students.map((s) => (
              <Item key={s.id} size="sm" className="px-0">
                <ItemContent>
                  <ItemTitle>
                    <Link href={`/dashboard/students/${s.id}`} className="hover:text-primary">
                      {s.firstName} {s.lastName}
                    </Link>
                  </ItemTitle>
                  <ItemDescription className="flex flex-wrap items-center gap-1.5">
                    {s.labels.map((l) => (
                      <Badge key={l} variant="secondary" className="font-normal">
                        {l}
                      </Badge>
                    ))}
                    <span>{t('credits', { count: s.credits })}</span>
                    {s.optOut ? <span>· {t('optedOut')}</span> : !s.phone && <span>· {t('noPhone')}</span>}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="sm" variant="outline" onClick={() => add(s.id)} disabled={adding !== null}>
                    {adding === s.id ? <Spinner /> : <UserPlus />} {t('addToCourse')}
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  )
}
