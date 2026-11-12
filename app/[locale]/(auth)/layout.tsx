import { Logo } from '@/components/brand/Logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-foreground via-foreground to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Logo inverted markClassName="size-10" className="[&>span:last-child]:text-2xl" />
          </div>
          <p className="text-muted-foreground/70 text-sm">Dance Studio Management System</p>
        </div>

        {/* Auth Card */}
        <div className="bg-background rounded-lg shadow-lg p-8 border border-border">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-muted-foreground/70 text-sm">
          <p>© 2026 StudioDesk. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
