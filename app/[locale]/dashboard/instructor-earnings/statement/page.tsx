import { getTranslations } from 'next-intl/server'
import { FileText } from 'lucide-react'
import { getInstructorStatement, getStatementInstructors } from '@/lib/actions/instructor-pay.actions'
import { getPayAccess } from '@/lib/auth/payAccess'
import { Card } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PageHeader } from '@/components/common/PageHeader'
import { InstructorsTabs } from '@/components/instructors/InstructorsTabs'
import { NoPayAccess } from '@/components/instructor-pay/NoPayAccess'
import { StatementView } from './statement-client'

export default async function InstructorStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations('instructorPay.statement')
  const params = await searchParams
  const month = typeof params.month === 'string' ? params.month : undefined

  const access = await getPayAccess()
  const instructorsResult = await getStatementInstructors()
  if (!access || !instructorsResult.data) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <NoPayAccess />
      </div>
    )
  }

  const instructors = instructorsResult.data
  const requested = typeof params.instructor === 'string' ? params.instructor : undefined
  // Instructors land on their own statement; managers pick one
  const instructorId = requested ?? (instructors.length === 1 ? instructors[0].id : undefined)
  const result = instructorId ? await getInstructorStatement(instructorId, month) : null

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <PageHeader title={t('title')} description={t('description')} />
      </div>
      {access.canManage && (
        <div className="print:hidden">
          <InstructorsTabs />
        </div>
      )}

      {result?.error ? (
        <Card className="p-6 text-sm text-danger">{result.error}</Card>
      ) : (
        <StatementView
          instructors={instructors.map((i) => ({ id: i.id, name: `${i.first_name} ${i.last_name}` }))}
          statement={result?.data ?? null}
          month={month}
        />
      )}

      {!instructorId && (
        <Empty className="border print:hidden">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>{t('pickInstructorTitle')}</EmptyTitle>
            <EmptyDescription>{t('pickInstructor')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
