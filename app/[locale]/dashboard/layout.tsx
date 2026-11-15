import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SidebarProvider } from '@/lib/context/SidebarContext'
import { OrganizationPrefsProvider } from '@/lib/context/OrganizationPrefsContext'
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
    <OrganizationPrefsProvider
      value={{ weekStartDay: organization.week_start_day ?? 1, currency: organization.currency ?? 'TRY' }}
    >
    <SidebarProvider>
      <div className="flex h-screen bg-background print:block print:h-auto">
        {/* Sidebar - Always rendered, handles responsive visibility internally */}
        <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full print:overflow-visible">
        {/* Top Bar */}
        <header className="bg-background border-b border-border h-14 md:h-16 print:hidden">
          <TopBar />
        </header>

        {/* Page Content - Responsive padding */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>
    </div>
    </SidebarProvider>
    </OrganizationPrefsProvider>
  )
}
