import { getTranslations } from 'next-intl/server'
import { Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export async function ReadOnlyNotice() {
  const t = await getTranslations('settings')
  return (
    <Alert>
      <Lock />
      <AlertDescription>{t('readOnly')}</AlertDescription>
    </Alert>
  )
}
