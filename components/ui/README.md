# UI Components Library

This is a comprehensive collection of reusable UI components built with shadcn/ui patterns and @radix-ui foundations.

## Calendar & Date Picker Components

### Calendar Component
**File:** `calendar.tsx`

A flexible calendar component supporting single/multiple/range date selection.

**Props:**
```typescript
interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  markedDates?: Set<string>  // Dates to highlight (format: "yyyy-MM-dd")
  initialFocus?: boolean
}
```

**Usage:**
```tsx
<Calendar
  mode="single"
  selected={selectedDate}
  onSelect={setSelectedDate}
  markedDates={attendanceDates}
/>
```

**Features:**
- Month navigation with prev/next buttons
- Visual indicators for today (border) and selected dates (blue bg)
- Marked dates styling (green bg for special dates like attendance records)
- Disabled date support
- Responsive grid layout

---

### DatePicker Component
**File:** `date-picker.tsx`

Generic, reusable date picker component combining Popover + Calendar.

**Props:**
```typescript
interface DatePickerProps {
  value?: Date
  onDateChange?: (date: Date) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  showIcon?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost"
}
```

**Usage:**
```tsx
<DatePicker
  value={selectedDate}
  onDateChange={(date) => handleDateChange(date)}
  placeholder="Pick a date"
  variant="outline"
/>
```

**Features:**
- Automatic popover positioning (no overflow issues)
- Calendar icon integration
- Format date display with PPP format
- Fully accessible via @radix-ui/popover

---

### AttendanceDatePicker Component
**File:** `../attendance/AttendanceDatePickerNew.tsx`

Specialized attendance date picker with Turkish localization and smart date formatting.

**Props:**
```typescript
interface AttendanceDatePickerProps {
  value?: string              // Format: "yyyy-MM-dd"
  onDateChange?: (dateStr: string) => void
  markedDates?: string[]      // Array of "yyyy-MM-dd" strings
  className?: string
  locale?: "tr-TR" | "en-US"
}
```

**Usage:**
```tsx
<AttendanceDatePicker
  value="2026-03-25"
  onDateChange={(dateStr) => handleDateChange(dateStr)}
  markedDates={attendanceHistory.map(r => r.session_date)}
  locale="tr-TR"
/>
```

**Features:**
- Turkish date display (Bugün, Yarın, Haftaya, etc.)
- Automatic highlighting of attendance history
- Custom button styling (blue background with calendar icon)
- String-based date handling (perfect for server components)
- Past and future date support

---

### Popover Component
**File:** `popover.tsx`

Wrapper around @radix-ui/react-popover for consistent styling and behavior.

**Exports:**
- `Popover` - Root component
- `PopoverTrigger` - Button/clickable element
- `PopoverContent` - Popover panel with auto-positioning
- `PopoverAnchor` - Optional alignment point

**Usage:**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <button>Open</button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar ... />
  </PopoverContent>
</Popover>
```

**Features:**
- Automatic smart positioning (prevents overflow)
- Smooth animations
- Portal rendering (prevents z-index stacking issues)
- Full keyboard support

---

## Integration Guide

### Where to Use DatePicker

1. **Earnings Filters** (Already Updated)
   - From Date / To Date selection
   - Location: `components/instructor-earnings/EarningsFilters.tsx`

2. **Cash Register** (Already Updated)
   - Transaction date filtering
   - Location: `components/cash-register/CashRegisterFilters.tsx`

3. **Attendance System** (Already Updated)
   - Session date selection with history highlighting
   - Location: `components/attendance/AttendanceDateSelector.tsx`

4. **Future Use Cases**
   - Course scheduling date ranges
   - Payment history filtering
   - Report generation date selection
   - Event scheduling
   - Any date-based filtering

### Implementation Pattern

**HTML Date Input (OLD):**
```tsx
<input
  type="date"
  defaultValue={dateStr}
  onChange={(e) => handleChange(e.target.value)}
/>
```

**DatePicker (NEW):**
```tsx
import { DatePicker } from '@/components/ui/date-picker'
import { format, parse } from 'date-fns'

const dateObj = dateStr ? parse(dateStr, 'yyyy-MM-dd', new Date()) : undefined

<DatePicker
  value={dateObj}
  onDateChange={(date) => {
    const formatted = format(date, 'yyyy-MM-dd')
    // Use formatted date
  }}
/>
```

---

## Benefits

✅ **Accessibility** - Full ARIA support via @radix-ui  
✅ **Positioning** - Automatic smart positioning prevents overflow  
✅ **Reusability** - Single component source of truth  
✅ **Consistency** - Unified styling across dashboard  
✅ **Maintainability** - Centralized code, easier updates  
✅ **Type Safety** - Full TypeScript support  
✅ **Mobile Friendly** - Works seamlessly on all screen sizes  

---

## Styling

All components use Tailwind CSS for styling with design tokens:
- Primary color: `#4F46E5` (Indigo)
- Borders: `#E5E7EB` (Gray)
- Text: `#111827` (Dark gray)
- Success: `green-100` / `green-800` (For marked dates)

Customize colors by modifying the Tailwind classes in each component.

---

## Dependencies

- `@radix-ui/react-popover@1.1.15` - Popover positioning and behavior
- `date-fns` - Date manipulation and formatting
- `lucide-react` - Icons
- React 19.2.3+ with TypeScript

---

## Migration Checklist

When replacing HTML date inputs in filter components:

- [ ] Add imports: `DatePicker`, `format`, `parse` from date-fns
- [ ] Convert `dateStr` to `dateObj` using `parse()`
- [ ] Replace `<input type="date">` with `<DatePicker>`
- [ ] Update handler to use `format()` for date strings
- [ ] Test on mobile and desktop
- [ ] Verify date filtering still works
