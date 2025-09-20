"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, GraduationCap, Calendar, BookOpen, Hash } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface StudentProfile {
  id: number
  name: string
  department: string
  year: number
  semester: number
  course: string
  phone?: string
  events_registered_count: number
  user?: {
    usernumber: string
    email: string
  } | null
}

export default function StudentProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          users(usernumber, email)
        `)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load profile information</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          My Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{profile.name}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Registration Number</label>
              <div className="flex items-center gap-2 mt-1">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{profile.user?.usernumber || 'N/A'}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{profile.user?.email || 'N/A'}</span>
              </div>
            </div>

            {profile.phone && (
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{profile.phone}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Department</label>
              <div className="flex items-center gap-2 mt-1">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{profile.department}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Course</label>
              <div className="flex items-center gap-2 mt-1">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{profile.course}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Year</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{profile.year}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Semester</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{profile.semester}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Activity Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-[#799EFF]">{profile.events_registered_count || 0}</div>
              <div className="text-sm text-gray-600">Events Registered</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-[#FFDE63]">Active</div>
              <div className="text-sm text-gray-600">Account Status</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">Student</div>
              <div className="text-sm text-gray-600">Role</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-6">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => window.location.reload()}
            >
              Refresh Profile
            </Button>
            <Button 
              className="bg-[#799EFF] hover:bg-[#6B8EFF] text-white cursor-pointer"
              onClick={() => alert('Profile editing will be available soon!')}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
