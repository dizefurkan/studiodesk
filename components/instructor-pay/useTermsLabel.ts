'use client'

import { useTranslations } from 'next-intl'
import { useOrganizationPrefs } from '@/lib/context/OrganizationPrefsContext'
import { formatCurrency } from '@/lib/utils/format'

export type RateTerms = {
  pay_model: string
  ratio: number | null
  amount: number | null
  min_amount: number | null
}

/** "%40", "Ders başı ₺500 · en az ₺300" … for a rate period. */
export function useTermsLabel() {
  const t = useTranslations('instructorPay.terms')
  const { currency } = useOrganizationPrefs()
  return (terms: RateTerms) => {
    const money = (n: number | null) => formatCurrency(Number(n ?? 0), currency)
    const main =
      terms.pay_model === 'per_lesson'
        ? t('per_lesson', { amount: money(terms.amount) })
        : terms.pay_model === 'per_hour'
          ? t('per_hour', { amount: money(terms.amount) })
          : terms.pay_model === 'per_student'
            ? t('per_student', { amount: money(terms.amount) })
            : t('percentage', { ratio: Number(terms.ratio ?? 0).toLocaleString() })
    return terms.min_amount ? `${main} · ${t('min', { amount: money(terms.min_amount) })}` : main
  }
}
