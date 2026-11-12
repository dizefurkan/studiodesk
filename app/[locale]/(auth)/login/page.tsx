'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth.actions'
import { Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      })
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Redirect based on user state
      if (result.nextStep === 'backoffice') {
        router.push('/backoffice')
      } else if (result.nextStep === 'no-access') {
        router.push('/no-access')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError(t('errors.serverError'))
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('auth.login')}</h2>
        <p className="text-muted-foreground">{t('auth.loginSubtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-foreground">{t('auth.emailAddress')}</Label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="mt-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox onCheckedChange={(c) => setFormData((prev) => ({ ...prev, rememberMe: c === true }))}
            id="rememberMe"
            checked={formData.rememberMe}
            disabled={loading}
          />
          <Label htmlFor="rememberMe" className="cursor-pointer">
            {t('auth.rememberMe')}
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.signIn')
          )}
        </Button>
      </form>

    </div>
  )
}
