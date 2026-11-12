"use client"

import * as React from "react"
import { format } from "date-fns"
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
      placeholder = "Pick a date",
      disabled,
      className,
      showIcon = true,
      variant = "outline",
    },
    ref
  ) => {
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
            {value ? format(value, "PPP") : placeholder}
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
