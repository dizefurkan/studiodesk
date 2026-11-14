'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Trash2, Edit2, Plus, X, CircleAlert } from 'lucide-react'
import { getStudios, createStudio, updateStudio, deleteStudio } from '@/lib/actions/studios.actions'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'

interface Studio {
  id: string
  name: string
  description: string | null
  capacity: number | null
  image_url: string | null
  created_at: string | null
}

interface StudioFormData {
  name: string
  description: string
  capacity: string
  image_url: string
}

export default function StudiosPage({ params }: { params: Promise<{ id: string }> }) {
  const tx = useTranslations('studios')
  const { id: branchId } = use(params)
  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<StudioFormData>({
    name: '',
    description: '',
    capacity: '',
    image_url: '',
  })

  const loadStudios = useCallback(async (id: string) => {
    const result = await getStudios(id)
    if (result.error) {
      setError(result.error)
    } else {
      setStudios(result.data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set after the await
    loadStudios(branchId)
  }, [branchId, loadStudios])

  const resetForm = () => {
    setFormData({ name: '', description: '', capacity: '', image_url: '' })
    setEditingId(null)
  }

  const handleEditClick = (studio: Studio) => {
    setFormData({
      name: studio.name,
      description: studio.description || '',
      capacity: studio.capacity?.toString() || '',
      image_url: studio.image_url || '',
    })
    setEditingId(studio.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError(tx('nameRequired'))
      return
    }

    try {
      let result
      if (editingId) {
        result = await updateStudio(editingId, {
          name: formData.name,
          description: formData.description || undefined,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          image_url: formData.image_url || undefined,
        })
      } else {
        result = await createStudio(branchId, {
          name: formData.name,
          description: formData.description || undefined,
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          image_url: formData.image_url || undefined,
        })
      }

      if (result.error) {
        setError(result.error)
      } else {
        await loadStudios(branchId)
        resetForm()
        setShowForm(false)
      }
    } catch (err) {
      setError(tx('error'))
    }
  }

  const confirm = useConfirm()

  const handleDelete = async (id: string) => {
    if ((await confirm({ title: tx('deleteConfirm'), destructive: true }))) {
      const result = await deleteStudio(id)
      if (result.error) {
        setError(result.error)
      } else {
        await loadStudios(branchId)
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">{tx('loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{tx('title')}</h1>
          <p className="text-muted-foreground mt-1">{tx('description')}</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}>
          <Plus size={20} className="mr-2" />
          {tx('add')}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button variant="ghost" size="icon-xs" aria-label={tx('dismiss')} onClick={() => setError(null)}>
              <X />
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-border p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            {editingId ? tx('editTitle') : tx('newTitle')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block mb-1">
                {tx('name')}
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={tx('namePlaceholder')}
                className="w-full"
                required
              />
            </div>

            <div>
              <Label className="block mb-1">
                {tx('descriptionLabel')}
              </Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={tx('descriptionPlaceholder')}
                className="w-full"
              />
            </div>

            <div>
              <Label className="block mb-1">
                {tx('capacity')}
              </Label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 20"
                className="w-full"
                min="1"
              />
            </div>

            <div>
              <Label className="block mb-1">
                {tx('imageUrl')}
              </Label>
              <Input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" >
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
              >
                {tx('cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Studios List */}
      {studios.length === 0 ? (
        <Card className="border-border p-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg">{tx('emptyTitle')}</p>
            <p className="text-sm mt-1">{tx('emptyDescription')}</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {studios.map((studio) => (
            <Card key={studio.id} className="border-border p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{studio.name}</h3>
                  {studio.description && (
                    <p className="text-muted-foreground text-sm mt-1">{studio.description}</p>
                  )}
                  {studio.capacity && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {tx.rich('capacityValue', {
                        count: studio.capacity,
                        b: (chunks) => <span className="font-medium">{chunks}</span>,
                      })}
                    </p>
                  )}
                  {studio.image_url && (
                    <p className="text-muted-foreground text-sm mt-1">{tx('hasImage')}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleEditClick(studio)}
                    variant="outline"
                    size="sm"
                    className="border-input hover:bg-muted"
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    onClick={() => handleDelete(studio.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 hover:bg-red-50"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
