"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone, GraduationCap, Calendar, BookOpen, Hash, Edit } from "lucide-react"
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    year: 1,
    semester: 1,
    course: '',
    phone: ''
  })
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
      
      // Populate edit form with current data
      setEditForm({
        name: data.name || '',
        department: data.department || '',
        year: data.year || 1,
        semester: data.semester || 1,
        course: data.course || '',
        phone: data.phone || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = () => {
    setIsEditModalOpen(true)
  }

  const handleUpdateProfile = async () => {
    if (!profile) return

    try {
      setIsUpdating(true)
      
      const { error } = await supabase
        .from('students')
        .update({
          name: editForm.name,
          department: editForm.department,
          year: editForm.year,
          semester: editForm.semester,
          course: editForm.course,
          phone: editForm.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      // Update local profile state
      setProfile({
        ...profile,
        name: editForm.name,
        department: editForm.department,
        year: editForm.year,
        semester: editForm.semester,
        course: editForm.course,
        phone: editForm.phone
      })

      setIsEditModalOpen(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsUpdating(false)
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

        {/* Actions */}
        <div className="border-t pt-6">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="cursor-pointer bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
              onClick={() => window.location.reload()}
            >
              Refresh Profile
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              onClick={handleEditProfile}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="department">School/Department</Label>
                  <Select 
                    value={editForm.department} 
                    onValueChange={(value) => setEditForm({...editForm, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school/department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="School of Architecture">School of Architecture</SelectItem>
                      <SelectItem value="School of Arts & Humanities">School of Arts & Humanities</SelectItem>
                      <SelectItem value="School of Business & Management">School of Business & Management</SelectItem>
                      <SelectItem value="School of Commerce, Finance and Accountancy">School of Commerce, Finance and Accountancy</SelectItem>
                      <SelectItem value="School of Education">School of Education</SelectItem>
                      <SelectItem value="School of Engineering and Technology">School of Engineering and Technology</SelectItem>
                      <SelectItem value="School of Law">School of Law</SelectItem>
                      <SelectItem value="School of Psychological Sciences">School of Psychological Sciences</SelectItem>
                      <SelectItem value="School of Sciences">School of Sciences</SelectItem>
                      <SelectItem value="School of Social Sciences">School of Social Sciences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select 
                    value={editForm.course} 
                    onValueChange={(value) => setEditForm({...editForm, course: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {/* Undergraduate Programs */}
                      <SelectItem value="Bachelor of Science (Data Science)">Bachelor of Science (Data Science)</SelectItem>
                      <SelectItem value="Bachelor of Science (Statistics)">Bachelor of Science (Statistics)</SelectItem>
                      <SelectItem value="BTech Computer Science and Engineering - Data Science">BTech Computer Science and Engineering - Data Science</SelectItem>
                      <SelectItem value="BTech Electronics & Communication Engineering">BTech Electronics & Communication Engineering</SelectItem>
                      <SelectItem value="BTech Automobile Engineering">BTech Automobile Engineering</SelectItem>
                      <SelectItem value="BA Psychology">BA Psychology</SelectItem>
                      <SelectItem value="BA English">BA English</SelectItem>
                      <SelectItem value="BBA Finance & Economics">BBA Finance & Economics</SelectItem>
                      <SelectItem value="BBA Business Analytics">BBA Business Analytics</SelectItem>
                      <SelectItem value="BBA General">BBA General</SelectItem>
                      <SelectItem value="BCom Accountancy & Taxation">BCom Accountancy & Taxation</SelectItem>
                      <SelectItem value="BCom Finance & Investment">BCom Finance & Investment</SelectItem>
                      <SelectItem value="BCom Applied Finance & Analytics">BCom Applied Finance & Analytics</SelectItem>
                      <SelectItem value="Bachelor of Architecture">Bachelor of Architecture</SelectItem>
                      <SelectItem value="Bachelor of Education">Bachelor of Education</SelectItem>
                      <SelectItem value="Bachelor of Laws (LLB)">Bachelor of Laws (LLB)</SelectItem>
                      
                      {/* Postgraduate Programs */}
                      <SelectItem value="Master of Commerce (MCom)">Master of Commerce (MCom)</SelectItem>
                      <SelectItem value="MSc Psychology HRDM">MSc Psychology HRDM</SelectItem>
                      <SelectItem value="MSc Clinical Psychology">MSc Clinical Psychology</SelectItem>
                      <SelectItem value="Master of Laws (LLM) Corporate & Commercial Law">Master of Laws (LLM) Corporate & Commercial Law</SelectItem>
                      <SelectItem value="Master of Laws (LLM) Intellectual Property & Trade Law">Master of Laws (LLM) Intellectual Property & Trade Law</SelectItem>
                      <SelectItem value="MTech Mechanical Engineering">MTech Mechanical Engineering</SelectItem>
                      <SelectItem value="MTech Electronics Engineering">MTech Electronics Engineering</SelectItem>
                      <SelectItem value="MBA">MBA</SelectItem>
                      <SelectItem value="Master of Architecture">Master of Architecture</SelectItem>
                      <SelectItem value="Master of Education">Master of Education</SelectItem>
                      
                      {/* Doctoral Programs */}
                      <SelectItem value="PhD Architecture">PhD Architecture</SelectItem>
                      <SelectItem value="PhD Arts & Humanities">PhD Arts & Humanities</SelectItem>
                      <SelectItem value="PhD Business & Management">PhD Business & Management</SelectItem>
                      <SelectItem value="PhD Commerce & Finance">PhD Commerce & Finance</SelectItem>
                      <SelectItem value="PhD Education">PhD Education</SelectItem>
                      <SelectItem value="PhD Engineering & Technology">PhD Engineering & Technology</SelectItem>
                      <SelectItem value="PhD Law">PhD Law</SelectItem>
                      <SelectItem value="PhD Psychology">PhD Psychology</SelectItem>
                      <SelectItem value="PhD Sciences">PhD Sciences</SelectItem>
                      <SelectItem value="PhD Social Sciences">PhD Social Sciences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select 
                    value={editForm.year.toString()} 
                    onValueChange={(value) => setEditForm({...editForm, year: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="semester">Semester</Label>
                  <Select 
                    value={editForm.semester.toString()} 
                    onValueChange={(value) => setEditForm({...editForm, semester: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Semester</SelectItem>
                      <SelectItem value="2">2nd Semester</SelectItem>
                      <SelectItem value="3">3rd Semester</SelectItem>
                      <SelectItem value="4">4th Semester</SelectItem>
                      <SelectItem value="5">5th Semester</SelectItem>
                      <SelectItem value="6">6th Semester</SelectItem>
                      <SelectItem value="7">7th Semester</SelectItem>
                      <SelectItem value="8">8th Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
