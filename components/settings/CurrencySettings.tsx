'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign } from 'lucide-react'
import { updateOrganizationSettings } from '@/lib/actions/organization.actions'
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/config/currencies'

interface CurrencySettingsProps {
  organizationId: string
  currentCurrency: string | null | undefined
}

export function CurrencySettings({ organizationId, currentCurrency }: CurrencySettingsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency || DEFAULT_CURRENCY)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const result = await updateOrganizationSettings(selectedCurrency)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `Currency updated to ${selectedCurrency}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update currency' })
    } finally {
      setLoading(false)
    }
  }

  const currentCurrencyName =
    SUPPORTED_CURRENCIES.find((c) => c.code === currentCurrency)?.name || 
    SUPPORTED_CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY)?.name || 
    'Turkish Lira (₺)'

  return (
    <Card className="border-[#E5E7EB] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#4F46E5] p-3 rounded-lg">
          <DollarSign className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Currency Settings</h2>
          <p className="text-sm text-gray-600">Currently: {currentCurrencyName}</p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {SUPPORTED_CURRENCIES.map((currency) => (
          <button
            key={currency.code}
            onClick={() => setSelectedCurrency(currency.code)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedCurrency === currency.code
                ? 'border-[#4F46E5]'
                : 'border-[#E5E7EB] hover:border-[#4F46E5]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currency.flag}</span>
              <div>
                <p className="font-semibold text-[#111827]">{currency.code}</p>
                <p className="text-sm text-gray-600">{currency.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={loading || selectedCurrency === currentCurrency}
        className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Currency'}
      </Button>
    </Card>
  )
}
