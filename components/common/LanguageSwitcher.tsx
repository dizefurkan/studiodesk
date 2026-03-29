'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  ]

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== locale) {
      // Get the current pathname without locale prefix
      const pathWithoutLocale = pathname.startsWith(`/${locale}`)
        ? pathname.slice(locale.length + 1)
        : pathname
      
      // Build new path with new locale
      const newPath = `/${newLocale}${pathWithoutLocale}`
      
      // Use window.location for hard redirect to force full page reload
      window.location.href = newPath
    }
    setIsOpen(false)
  }

  const currentLanguage = languages.find((lang) => lang.code === locale)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-gray-600 hover:text-gray-900"
        title="Change language"
      >
        <Globe size={18} />
        <span className="hidden sm:inline text-sm">{currentLanguage?.name}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2',
                locale === lang.code ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {locale === lang.code && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
