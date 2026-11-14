'use client'

import { Link } from '@/i18n/navigation'
import { ArrowRightLeft, ChevronDown, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from 'next-intl'

interface InstructorDropdownProps {
  instructor: { id: string; first_name: string; last_name: string }
  replacementInstructor?: { id: string; first_name: string; last_name: string }
  isOverridden: boolean
  onReplaceClick: () => void
  onClearOverride: () => void
}

export function InstructorDropdown({
  instructor,
  replacementInstructor,
  isOverridden,
  onReplaceClick,
  onClearOverride,
}: InstructorDropdownProps) {
  const tx = useTranslations('instructorDropdown')
  // Show replacement instructor if available, otherwise the original
  const display = replacementInstructor || instructor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          {display.first_name} {display.last_name}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/instructors/${instructor.id}`}>
            <ExternalLink /> {tx('goToDetail')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onReplaceClick}>
          <ArrowRightLeft /> {tx('replace')}
        </DropdownMenuItem>
        {isOverridden && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onClearOverride}>
              <Trash2 /> {tx('clearOverride')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
