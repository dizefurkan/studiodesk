import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getOrganization } from '@/lib/auth/getOrganization'

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
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <aside className="hidden md:block w-64 bg-white border-r border-[#E5E7EB] overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#E5E7EB] h-14 md:h-16">
          <TopBar />
        </header>

        {/* Page Content - Responsive padding */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
