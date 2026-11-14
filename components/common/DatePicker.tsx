"use client"

import * as React from "react"
import { format } from "date-fns"
import { useTranslations } from "next-intl"
import { useDateFnsLocale } from "@/hooks/useDateFnsLocale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onDateChange?: (date: Date) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  showIcon?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost"
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onDateChange,
      placeholder,
      disabled,
      className,
      showIcon = true,
      variant = "outline",
    },
    ref
  ) => {
    const t = useTranslations("common")
    const dateLocale = useDateFnsLocale()
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant={variant}
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            {showIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
            {value ? format(value, "PPP", { locale: dateLocale }) : (placeholder ?? t("pickDate"))}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (date) {
                onDateChange?.(date)
              }
            }}
            disabled={disabled}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker }
