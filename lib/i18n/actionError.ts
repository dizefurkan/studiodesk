import { getTranslations } from 'next-intl/server'
import type en from '@/messages/en.json'

export type ActionErrorKey = keyof (typeof en)['serverErrors']

/**
 * A user-facing error message for a server action, in the request's locale.
 * Server actions return these as `{ error }`; never compare against the text —
 * it differs per language.
 */
export async function actionError(
  key: ActionErrorKey,
  values?: Record<string, string | number>
): Promise<string> {
  const t = await getTranslations('serverErrors')
  return t(key, values)
}
