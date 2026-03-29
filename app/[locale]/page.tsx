import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, TrendingUp, BarChart3, Shield, Zap } from 'lucide-react'

export default async function HomePage() {
  const t = await getTranslations()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#4F46E5]">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">StudioDesk</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:text-white">
                {t('auth.signIn')}
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#4F46E5] hover:bg-[#4338CA]">
                {t('auth.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Manage Your Dance Studio
          <span className="block text-[#4F46E5]">Like Never Before</span>
        </h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          {t('pages.home.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8">
              {t('auth.startFreeTrial')}
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
              {t('auth.learnMore')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white/5 backdrop-blur-md py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            {t('pages.home.subtitle')}
          </h3>
          <p className="text-gray-300 text-center mb-16 max-w-2xl mx-auto">
            Everything you need to run a successful dance studio
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: t('pages.home.studentManagement'),
                description: t('pages.home.studentManagementDesc'),
              },
              {
                icon: BookOpen,
                title: t('pages.home.courseManagement'),
                description: t('pages.home.courseManagementDesc'),
              },
              {
                icon: TrendingUp,
                title: t('pages.home.instructorManagement'),
                description: t('pages.home.instructorManagementDesc'),
              },
              {
                icon: BarChart3,
                title: t('pages.home.reporting'),
                description: t('pages.home.reportingDesc'),
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Enterprise-grade security with data isolation',
              },
              {
                icon: Zap,
                title: 'Fast & Reliable',
                description: 'Built on modern cloud infrastructure',
              },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
                  <CardContent className="p-6">
                    <Icon className="w-8 h-8 text-[#4F46E5] mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h3 className="text-4xl font-bold text-white mb-6">
          Ready to Transform Your Studio?
        </h3>
        <p className="text-xl text-gray-300 mb-10">
          Join hundreds of dance studios using StudioDesk
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8">
            Start Your Free Trial Today
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>&copy; 2026 StudioDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
