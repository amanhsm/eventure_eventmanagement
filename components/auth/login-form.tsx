"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export function LoginForm() {
  const [credential, setCredential] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { login } = useAuth() // Use auth context login method

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!credential || !password || !role) {
        throw new Error("Please fill in all fields")
      }

      const supabase = createClient()

      console.log("[AUTH] Attempting login with:", { 
        credential, 
        role, 
        passwordLength: password.length
      })

      // Use the verify_user function from our schema
      const { data: userData, error: userError } = await supabase.rpc("verify_user", {
        p_usernumber: credential,
        p_user_type: role,
        p_password: password,
      })

      console.log("[AUTH] RPC response:", { userData, userError })

      if (userError) {
        console.error("[AUTH] RPC error:", userError)
        throw new Error(`Database error: ${userError.message}`)
      }

      if (!userData || userData.length === 0) {
        throw new Error("Invalid credentials - user not found or password incorrect")
      }

      const user = userData[0]
      console.log("[AUTH] User found:", user)

      // Get additional user profile data based on role
      let profileData = null
      if (role === "student") {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", user.id)
          .single()
        
        console.log("[AUTH] Student profile query:", { 
          user_id: user.id, 
          studentData, 
          studentError
        })
        
        if (studentError) {
          console.warn("[AUTH] Could not fetch student profile:", studentError)
        } else if (studentData) {
          profileData = studentData
        }
      } else if (role === "organizer") {
        const { data: organizerData, error: organizerError } = await supabase
          .from("organizers")
          .select("*")
          .eq("user_id", user.id)
          .single()
        
        console.log("[AUTH] Organizer profile query:", { 
          user_id: user.id, 
          organizerData, 
          organizerError
        })
        
        if (organizerError) {
          console.warn("[AUTH] Could not fetch organizer profile:", organizerError)
        } else if (organizerData) {
          profileData = organizerData
        }
      } else if (role === "admin") {
        const { data: adminData, error: adminError } = await supabase
          .from("administrators")
          .select("*")
          .eq("user_id", user.id)
          .single()
        
        console.log("[AUTH] Admin profile query:", { 
          user_id: user.id, 
          adminData, 
          adminError
        })
        
        if (adminError) {
          console.warn("[AUTH] Could not fetch admin profile:", adminError)
        } else if (adminData) {
          profileData = adminData
        }
      }

      const authenticatedUser = {
        id: user.id,
        usernumber: user.usernumber,
        role: user.user_type as "student" | "organizer" | "admin",
      }

      console.log("[AUTH] Login successful for user:", authenticatedUser.usernumber, authenticatedUser.role)

      // Update last login timestamp
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", user.id)

      await login(authenticatedUser, profileData || undefined)

      // Route to appropriate dashboard
      console.log("[AUTH] Routing to dashboard for role:", role)
      
      switch (role) {
        case "student":
          router.push("/dashboard/student")
          break
        case "organizer":
          router.push("/dashboard/organizer")
          break
        case "admin":
          router.push("/dashboard/admin")
          break
        default:
          router.push("/dashboard")
      }
    } catch (error: any) {
      console.log("[AUTH] Login error:", error)
      setError(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role" className="text-white">
              Role
            </Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="organizer">Event Organizer</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credential" className="text-white">
              {role === "student"
                ? "Registration Number"
                : role === "organizer"
                  ? "Employee ID"
                  : role === "admin"
                    ? "Username"
                    : "Credential"}
            </Label>
            <Input
              id="credential"
              type="text"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder={
                role === "student"
                  ? "Enter 7-digit registration number"
                  : role === "organizer"
                    ? "Enter 7-digit employee ID"
                    : role === "admin"
                      ? "Enter username"
                      : "Enter credential"
              }
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
              required
            />
          </div>

          {error && <div className="text-red-300 text-sm bg-red-500/10 p-2 rounded">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-blue-200">Use your university credentials to access the system</p>
        </div>
      </CardContent>
    </Card>
  )
}
