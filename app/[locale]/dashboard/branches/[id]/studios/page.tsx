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
      setError('Studio name is required')
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
      setError('An error occurred')
    }
  }

  const confirm = useConfirm()

  const handleDelete = async (id: string) => {
    if ((await confirm({ title: 'Are you sure you want to delete this studio?', destructive: true }))) {
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
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Studios</h1>
          <p className="text-muted-foreground mt-1">Manage dance studios in this branch</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}>
          <Plus size={20} className="mr-2" />
          Add Studio
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
          <AlertAction>
            <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={() => setError(null)}>
              <X />
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-border p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            {editingId ? 'Edit Studio' : 'New Studio'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block mb-1">
                Studio Name *
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Salon 1"
                className="w-full"
                required
              />
            </div>

            <div>
              <Label className="block mb-1">
                Description
              </Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Ground floor, near entrance"
                className="w-full"
              />
            </div>

            <div>
              <Label className="block mb-1">
                Capacity (Students)
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
                Image URL (for future)
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
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Studios List */}
      {studios.length === 0 ? (
        <Card className="border-border p-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg">No studios yet</p>
            <p className="text-sm mt-1">Create your first studio to organize dance classes</p>
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
                      Capacity: <span className="font-medium">{studio.capacity} students</span>
                    </p>
                  )}
                  {studio.image_url && (
                    <p className="text-muted-foreground text-sm mt-1">Has image (future use)</p>
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
