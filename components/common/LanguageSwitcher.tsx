'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
]

export function LanguageSwitcher() {
  const pathname = usePathname()
  const locale = useLocale()
  const current = LANGUAGES.find((l) => l.code === locale)

  const change = (next: string) => {
    if (next === locale) return
    const rest = pathname.startsWith(`/${locale}`) ? pathname.slice(locale.length + 1) : pathname
    // hard navigation so server components re-render with the new messages
    window.location.href = `/${next}${rest}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="Change language">
          <Globe />
          <span className="hidden sm:inline">{current?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup value={locale} onValueChange={change}>
          {LANGUAGES.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>
              <span aria-hidden>{l.flag}</span> {l.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
