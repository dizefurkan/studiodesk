import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SidebarProvider } from '@/lib/context/SidebarContext'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { isPlatformAdmin } from '@/lib/auth/platformAdmin'
import { mustChangePassword } from '@/lib/auth/passwordPolicy'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect({ href: '/login', locale: await getLocale() })
  }

  if (mustChangePassword(user)) {
    redirect({ href: '/change-password', locale: await getLocale() })
  }

  const organization = await getOrganization()

  if (!organization) {
    redirect({ href: (await isPlatformAdmin(user.id)) ? '/backoffice' : '/no-access', locale: await getLocale() })
  }

  if (organization.is_active === false) {
    redirect({ href: '/no-access?reason=suspended', locale: await getLocale() })
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted/50">
        {/* Sidebar - Always rendered, handles responsive visibility internally */}
        <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <header className="bg-background border-b border-border h-14 md:h-16">
          <TopBar />
        </header>

        {/* Page Content - Responsive padding */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </SidebarProvider>
  )
}
