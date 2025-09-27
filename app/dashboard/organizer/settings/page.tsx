"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useCustomToast } from "@/hooks/use-toast-custom"
import { ArrowLeft, Save, Moon, Sun, User, Mail, Phone, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

export default function OrganizerSettings() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast, ToastContainer } = useCustomToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    darkMode: false,
    emailNotifications: true,
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchOrganizerData = async () => {
      if (!user) return

      try {
        // First get organizer data
        const { data: organizerData, error: organizerError } = await supabase
          .from('organizers')
          .select('name, department')
          .eq('user_id', user.id)
          .single()

        if (organizerError) {
          console.error('Organizer query error:', organizerError)
          throw organizerError
        }

        // Then get user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, phone')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('User query error:', userError)
          throw userError
        }

        console.log('Fetched organizer data:', organizerData)
        console.log('Fetched user data:', userData)

        setSettings({
          name: organizerData?.name || "",
          email: userData?.email || "",
          phone: userData?.phone || "",
          department: organizerData?.department || "",
          darkMode: localStorage.getItem('darkMode') === 'true',
          emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
        })
      } catch (error) {
        console.error('Error fetching organizer data:', error)
        showToast('Error', 'Failed to load profile data', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizerData()
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Update organizer name and department
      const { error: organizerError } = await supabase
        .from('organizers')
        .update({ 
          name: settings.name,
          department: settings.department
        })
        .eq('user_id', user.id)

      if (organizerError) throw organizerError

      // Update user email and phone
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          email: settings.email,
          phone: settings.phone 
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Save preferences to localStorage
      localStorage.setItem('darkMode', settings.darkMode.toString())
      localStorage.setItem('emailNotifications', settings.emailNotifications.toString())

      showToast('Success!', 'Settings saved successfully', 'success')
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Error', 'Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["organizer"]}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["organizer"]}>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={settings.department}
                    onChange={(e) => setSettings({ ...settings, department: e.target.value })}
                    placeholder="Enter your department"
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
                  <div className="flex items-center gap-2">
                    {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-gray-600">Switch between light and dark theme</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive updates about your events</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-4xl mx-auto mt-8">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
