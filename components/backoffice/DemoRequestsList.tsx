'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Mail, Phone } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { setDemoRequestStatus, type DemoRequest, type DemoRequestStatus } from '@/lib/actions/demo-requests.actions'
import { FormattedDate } from '@/components/common/FormattedDate'
import { Badge } from '@/components/ui/badge'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

const STATUSES: DemoRequestStatus[] = ['new', 'contacted', 'closed']

export function DemoRequestsList({ requests }: { requests: DemoRequest[] }) {
  const t = useTranslations('backoffice.demoRequests')
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (requests.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
  }

  const change = async (id: string, status: DemoRequestStatus) => {
    setBusy(id)
    const res = await setDemoRequestStatus(id, status)
    setBusy(null)
    if (res.error) toast.error(res.error)
    else router.refresh()
  }

  return (
    <ul className="divide-y divide-border">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{r.studio_name}</p>
              {r.status === 'new' && <Badge>{t('status.new')}</Badge>}
            </div>
            <p className="text-sm text-foreground">
              {r.name}
              {r.city && <span className="text-muted-foreground">, {r.city}</span>}
              {r.student_count && (
                <span className="text-muted-foreground">, {t(`studentCount.${r.student_count as 'lt50'}`)}</span>
              )}
            </p>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                <Phone className="size-3.5" /> {r.phone}
              </a>
              {r.email && (
                <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Mail className="size-3.5" /> {r.email}
                </a>
              )}
            </p>
            {r.message && <p className="whitespace-pre-wrap text-sm text-foreground">{r.message}</p>}
            <p className="text-xs text-muted-foreground">
              <FormattedDate value={r.created_at} withTime />
            </p>
          </div>
          <NativeSelect
            value={r.status}
            disabled={busy === r.id}
            onChange={(e) => change(r.id, e.target.value as DemoRequestStatus)}
            aria-label={t('statusLabel')}
            className="sm:w-40"
          >
            {STATUSES.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {t(`status.${s}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </li>
      ))}
    </ul>
  )
}
