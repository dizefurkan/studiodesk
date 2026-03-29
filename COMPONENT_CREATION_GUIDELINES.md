# Component Creation Guidelines 📋

## ⚠️ KURAL: Mevcut Shadcn Components Kullan

### Temel İlke
Yeni component oluştururken **MUTLAKA** önce aşağıdakilerden faydalanılmalıdır:

1. **`/components/ui/` klasöründeki mevcut shadcn components**
2. **Radix UI primitives** (temel building blocks)
3. **Tailwind CSS** (styling)

Ancak **ASLA** kendimiz yazılmış custom UI components oluşturulmaz.

---

## 📦 Mevcut Reusable Components

### Popover & Dropdown
- ✅ `/components/ui/popover.tsx` - Radix PopoverPrimitive tabanlı
  - `<Popover>`
  - `<PopoverTrigger>`
  - `<PopoverContent>`
  - Kullanım: açılabilir/kapanabilir içerik, tooltips, menus

- ✅ `/components/ui/select-dropdown.tsx` - Select component

### Cards & Layout
- ✅ `/components/ui/card.tsx` - Container
- ✅ `/components/ui/badge.tsx` - Labels, tags

### Forms
- ✅ `/components/ui/form.tsx` - React Hook Form integration
- ✅ `/components/ui/input.tsx` - Text input
- ✅ `/components/ui/label.tsx` - Form labels
- ✅ `/components/ui/calendar.tsx` - Date picker

### Buttons
- ✅ `/components/ui/button.tsx` - All button variants

### Date Handling
- ✅ `/components/ui/date-picker.tsx` - Date selection

---

## ✅ Doğru Yol: Popover Kullanımı

### ❌ YANLIŞ (Custom Component)
```tsx
// ❌ components/calendar/ClassesPopover.tsx
// Custom popover yazma!
function ClassesPopover() {
  const [position, setPosition] = useState()
  const [isOpen, setIsOpen] = useState()
  // ... 100+ satır custom code
}
```

### ✅ DOĞRU (Shadcn Popover)
```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

export function ClassesDisplay({ day, courses }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-lg font-bold">+{courses.length}</button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id}>{course.name}</div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

---

## 🎨 Styling Kuralları

Yeni component oluştururken:

1. **SADECE Tailwind CSS kullan**
   ```tsx
   // ✅ Doğru
   className="p-4 bg-blue-50 rounded-lg border border-[#E5E7EB]"
   
   // ❌ Yanlış
   style={{ position: 'fixed', top: '10px' }} // Inline style minimal use
   ```

2. **Text renkleri standardı uygula**
   - Primary: `text-[#111827]`
   - Secondary: `text-[#6B7280]`
   - Muted: `text-[#9CA3AF]`
   - Brand: `text-[#4F46E5]`

3. **Borders standardı uygula**
   - Border: `border-[#E5E7EB]`

---

## 📝 Checklist: Yeni Component Oluşturmadan Önce

- [ ] `/components/ui/` klasöründe benzer component var mı?
- [ ] Radix UI primitive kullanılabilir mi?
- [ ] Tailwind CSS ile özelleştirilebilir mi?
- [ ] Zaten yapılanı tekrar yazmam mı?
- [ ] shadcn component'i extend edebilir miyim?

Tüm sorulara "EVET" cevabı verirse → **shadcn component kullan**

---

## 📚 Sık Kullanılan Kombinasyonlar

### Modal/Popover ile Content
```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80 p-4">
    {/* Content here */}
  </PopoverContent>
</Popover>
```

### Form Builder
```tsx
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// Kullanımı: components/courses/CourseForm.tsx'de var
```

### Selection/Dropdown
```tsx
import { Select } from '@/components/ui/select-dropdown'
// veya
import { Button } from '@/components/ui/button'
```

---

## 🚫 Yasak Şeyler

| ❌ Yapma | ✅ Yap |
|---------|-------|
| Custom popover/modal yazma | shadcn Popover kullan |
| Custom dropdown yazma | shadcn Select veya Button dropdown pattern |
| Fixed/absolute positioning (pozisyonlandırma) | Radix positioning (auto-handle) |
| Kendi tooltip'i yazma | shadcn Popover + Radix tooltip |
| Custom dropdown animation | Radix animation primitives (zaten built-in) |

---

## 🔍 Kontrol: Component Var mı?

Yeni component yazacağınız zaman:
```bash
# /components/ui/ klasöründe kontrol et
ls /components/ui/*.tsx

# Popover? ✅ popover.tsx
# Select? ✅ select-dropdown.tsx
# Tooltip? ✅ Popover kullan!
# Modal? ✅ Popover kullan!
```

---

## 📖 Örnek Implementation

### Eski (❌ YANLIŞ)
```tsx
// components/calendar/ClassesPopover.tsx (Custom)
function ClassesPopover() {
  const [position, setPosition] = useState()
  const [isOpen, setIsOpen] = useState()
  // ... 80 satır code
}
```

### Yeni (✅ DOĞRU)
```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

// calendar page'de direkt kullan:
<Popover>
  <PopoverTrigger asChild>
    <button onClick={() => ...}>
      +{courses.length}
    </button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-3">
      {courses.map(course => (
        <div key={course.id} className="p-3 bg-blue-50 rounded-lg">
          {course.name}
        </div>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

---

## 🎯 Özet

| Durum | Çözüm |
|-------|-------|
| Açılır/kapanır içerik | `Popover` |
| Dropdown seçim | `Select-dropdown` veya `Button` + `Popover` |
| GForm alanları | `Form` + `input/label` |
| Badge/tag | `Badge` |
| Container | `Card` |
| Tarih seçimi | `DatePicker` veya `Calendar` |

**KURAL:** Shadcn component'i var mı? → Evet → Kullan. Hayır → Yaz (ancak bu nadiren gerekli)
