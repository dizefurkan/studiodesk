'use client'

import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { CircleAlert, ShoppingCart } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldSet, FieldLegend, FieldTitle } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/utils/format'
import { purchasePackage } from '@/lib/actions/students.actions'
import { useTranslations } from 'next-intl'

interface StudentPurchaseDialogProps {
  studentId: string
  packages: Array<{
    id: string
    name: string
    total_credits: number
    price: number
    dance_types?: { name: string } | null
  }>
  currency?: string
  /** Open on load (e.g. /students/:id?purchase=1 from the attendance sheet) */
  defaultOpen?: boolean
}

export function StudentPurchaseDialog({ studentId, packages, currency = 'TRY', defaultOpen = false }: StudentPurchaseDialogProps) {
  const tx = useTranslations('purchaseDialog')
  const tf = useTranslations('forms')
  const router = useRouter()
  const [open, setOpen] = useState(defaultOpen)
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = packages.find((p) => p.id === selectedPackageId)
  const total = customPrice ? parseFloat(customPrice) : selected?.price

  const reset = () => {
    setSelectedPackageId('')
    setCustomPrice('')
    setError('')
  }

  const handlePurchase = async () => {
    if (!selectedPackageId) {
      setError(tx('selectRequired'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await purchasePackage({
        studentId,
        packageId: selectedPackageId,
        price: customPrice ? parseFloat(customPrice) : undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        reset()
        router.refresh()
      }
    } catch {
      setError(tx('failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart /> {tx('title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tx('title')}</DialogTitle>
          <DialogDescription>{tx('description')}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldLegend variant="label">{tx('selectPackage')}</FieldLegend>
          <RadioGroup
            value={selectedPackageId}
            onValueChange={(v) => {
              setSelectedPackageId(v)
              setCustomPrice('')
            }}
            className="max-h-72 overflow-y-auto"
          >
            {packages.map((pkg) => (
              <FieldLabel key={pkg.id} htmlFor={`pkg-${pkg.id}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{pkg.name}</FieldTitle>
                    <FieldDescription>
                      {tx('creditsCount', { count: pkg.total_credits })}{pkg.dance_types?.name ? ` • ${pkg.dance_types.name}` : ''} •{' '}
                      {formatCurrency(pkg.price, currency)}
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={pkg.id} id={`pkg-${pkg.id}`} />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>

        {selected && (
          <>
            <Field>
              <FieldLabel htmlFor="custom-price">{tx('priceOverride')}</FieldLabel>
              <Input
                id="custom-price"
                type="number"
                min={0}
                placeholder={String(selected.price)}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
              <FieldDescription>{tx('priceHint')}</FieldDescription>
            </Field>
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tx('package')}</span>
                <span className="font-medium">{selected.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tx('credits')}</span>
                <span className="font-medium">{selected.total_credits}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">{tx('total')}</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(total ?? 0, currency)}</span>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tf('cancel')}
          </Button>
          <Button onClick={handlePurchase} disabled={!selectedPackageId || loading}>
            {loading && <Spinner />}
            {loading ? tx('processing') : tx('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
