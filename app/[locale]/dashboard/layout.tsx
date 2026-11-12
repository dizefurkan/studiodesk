import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SidebarProvider } from '@/lib/context/SidebarContext'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'
import { isPlatformAdmin } from '@/lib/auth/platformAdmin'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const organization = await getOrganization()

  if (!organization) {
    redirect((await isPlatformAdmin(user.id)) ? '/backoffice' : '/no-access')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types lack is_active / nested selects
  if ((organization as any).is_active === false) {
    redirect('/no-access?reason=suspended')
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
