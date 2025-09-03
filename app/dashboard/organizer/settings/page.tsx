"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ArrowLeft, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function OrganizerSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    organizationName: "Tech Club",
    contactEmail: "techclub@christuniversity.in",
    phone: "+91-9876543210",
    description: "We organize technical workshops and coding events",
    notifications: true,
    autoApproval: false,
    publicProfile: true,
  })

  const handleSave = () => {
    console.log("[v0] Saving organizer settings:", settings)
    alert("Settings saved successfully!")
  }

  return (
    <ProtectedRoute allowedRoles={["organizer"]}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizer Settings</h1>
              <p className="text-gray-600">Manage your organization profile and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={settings.organizationName}
                    onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive updates about your events</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Approval</Label>
                    <p className="text-sm text-gray-600">Automatically approve venue bookings</p>
                  </div>
                  <Switch
                    checked={settings.autoApproval}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoApproval: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-gray-600">Make your organization visible to students</p>
                  </div>
                  <Switch
                    checked={settings.publicProfile}
                    onCheckedChange={(checked) => setSettings({ ...settings, publicProfile: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
