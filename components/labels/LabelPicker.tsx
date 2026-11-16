'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Plus, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { createLabel, setCourseLabels, setStudentLabels } from '@/lib/actions/labels.actions'

export type LabelOption = { id: string; name: string }

/**
 * A student's or course's labels as badges, with a picker to toggle existing labels
 * or create a new one by typing its name. Every change saves right away.
 */
export function LabelPicker({
  target,
  id,
  labels: initialLabels,
  selectedIds: initialSelected,
}: {
  target: 'student' | 'course'
  id: string
  labels: LabelOption[]
  selectedIds: string[]
}) {
  const t = useTranslations('labels')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [labels, setLabels] = useState(initialLabels)
  const [selected, setSelected] = useState<string[]>(initialSelected)
  const [pending, startTransition] = useTransition()

  const save = (next: string[]) => {
    const previous = selected
    setSelected(next)
    startTransition(async () => {
      const res = target === 'student' ? await setStudentLabels(id, next) : await setCourseLabels(id, next)
      if (res.error) {
        setSelected(previous)
        toast.error(res.error)
        return
      }
      router.refresh()
    })
  }

  const toggle = (labelId: string) =>
    save(selected.includes(labelId) ? selected.filter((x) => x !== labelId) : [...selected, labelId])

  const name = query.replace(/\s+/g, ' ').trim()
  const exact = labels.some((l) => l.name.toLocaleLowerCase() === name.toLocaleLowerCase())

  const create = () => {
    if (!name) return
    startTransition(async () => {
      const res = await createLabel(name)
      if (res.error || !res.data) {
        toast.error(res.error)
        return
      }
      const created = res.data
      setLabels((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setQuery('')
      save([...selected, created.id])
    })
  }

  const chosen = labels.filter((l) => selected.includes(l.id))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chosen.map((l) => (
        <Badge key={l.id} variant="secondary">
          {l.name}
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
            {pending ? <Spinner /> : chosen.length > 0 ? <Tag /> : <Plus />}
            {chosen.length > 0 ? t('edit') : t('add')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t('searchOrCreate')}
              value={query}
              onValueChange={setQuery}
              onKeyDown={(e) => {
                // Enter creates the typed label when no existing label matches it
                const needle = name.toLocaleLowerCase()
                if (e.key === 'Enter' && name && !labels.some((l) => l.name.toLocaleLowerCase().includes(needle))) {
                  e.preventDefault()
                  create()
                }
              }}
            />
            <CommandList>
              {/* While typing, the "create" row takes the place of the empty message */}
              {!name && <CommandEmpty>{t('none')}</CommandEmpty>}
              {labels.length > 0 && (
                <CommandGroup>
                  {labels.map((l) => {
                    const isOn = selected.includes(l.id)
                    return (
                      <CommandItem key={l.id} value={l.name} onSelect={() => toggle(l.id)}>
                        <Check className={cn('size-4', isOn ? 'opacity-100' : 'opacity-0')} />
                        {l.name}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
              {name && !exact && (
                // forceMount: cmdk would otherwise hide the group while it filters by the search text
                <CommandGroup forceMount>
                  <CommandItem value={`__create__${name}`} onSelect={create} forceMount>
                    <Plus className="size-4" />
                    {t('create', { name })}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
