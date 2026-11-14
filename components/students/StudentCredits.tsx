'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, AlertCircle, Plus, Minus, X } from 'lucide-react'
import { updateStudentPackageCredits } from '@/lib/actions/students.actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface StudentCreditsProps {
  packages: Array<{
    id: string
    remaining_credits: number
    packages?: {
      name: string
      total_credits: number
      dance_types?: { name: string } | null
    } | null
  }>
  loading?: boolean
}

export function StudentCredits({ packages, loading }: StudentCreditsProps) {
  const tx = useTranslations('studentCredits')
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)

  const handleUpdateCredits = async (packageId: string, newAmount: number) => {
    if (!packageId) {
      toast.error(tx('missingPackage'))
      return
    }
    if (newAmount < 0) return
    
    setUpdating(packageId)
    try {
      const result = await updateStudentPackageCredits(packageId, newAmount)
      if (result.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(tx('updateFailed'))
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <Card className="border-border p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </Card>
    )
  }

  if (!packages || packages.length === 0) {
    return (
      <Card className="border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="text-primary" size={20} />
          <h2 className="text-lg font-semibold text-foreground">{tx('title')}</h2>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="mx-auto text-input mb-2" size={32} />
          <p className="text-muted-foreground">{tx('empty')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-primary" size={20} />
          <h2 className="text-lg font-semibold text-foreground">{tx('title')}</h2>
        </div>

        <div className="space-y-4">
          {packages.map((pkg, idx) => {
            const danceType = pkg.packages?.dance_types?.name || tx('unknownDanceType')
            const name = pkg.packages?.name || tx('packageFallback')
            const total = pkg.packages?.total_credits || 0
            const remaining = pkg.remaining_credits || 0
            const used = Math.max(0, total - remaining)
            const percentage = total > 0 ? (remaining / total) * 100 : 0

            const statusColor =
              percentage > 50 ? 'bg-green-50' : percentage > 25 ? 'bg-yellow-50' : 'bg-red-50'
            const badgeColor =
              percentage > 50 ? 'bg-green-100 text-green-800' : percentage > 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

            return (
              <div key={idx} className={`p-4 rounded-lg border border-border ${statusColor}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">{danceType}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
                    {remaining} / {total}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-input rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="text-xs text-muted-foreground mb-4 flex items-center justify-between">
                  <span>{used} used • {remaining} left</span>
                  {editingPackageId === pkg.id ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateCredits(pkg.id, remaining - 1)}
                        disabled={updating === pkg.id || remaining === 0}
                        className="text-red-600 border-red-300 hover:bg-red-50 h-7 px-2"
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="text-sm font-semibold min-w-[40px] text-center">{remaining}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateCredits(pkg.id, remaining + 1)}
                        disabled={updating === pkg.id || remaining === total}
                        className="text-green-600 border-green-300 hover:bg-green-50 h-7 px-2"
                      >
                        <Plus size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPackageId(null)}
                        disabled={updating === pkg.id}
                        className="text-muted-foreground border-input hover:bg-muted/50 h-7 px-2"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="link" size="sm" className="h-auto p-0"
                      onClick={() => setEditingPackageId(pkg.id)}
                    >
                      {tx('edit')}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
