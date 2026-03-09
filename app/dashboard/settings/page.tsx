import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization settings</p>
      </div>

      {/* Organization Settings */}
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>Edit your studio information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="mx-auto text-[#9CA3AF] mb-4" size={48} />
            <p className="text-gray-600 mb-4">
              Update your organization name, contact information, and other details.
            </p>
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              Edit Organization
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Add team members, assign roles, and manage access permissions.
            </p>
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              Manage Team
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Configure payment processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Set up payment methods and configure payment processing options.
            </p>
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              Configure Payments
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-[#E5E7EB]">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Manage email alerts, reminders, and notification settings.
            </p>
            <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
              Configure Notifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
