"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface CustomUser {
  id: number
  usernumber: string
  role: "student" | "organizer" | "admin"
}

interface UserProfile {
  id: number
  name: string
  department?: string
  year?: number
  semester?: number
  course?: string
  events_registered_count?: number
  events_created_count?: number
}

interface AuthContextType {
  user: CustomUser | null
  profile: UserProfile | null
  login: (userData: CustomUser, profileData?: UserProfile) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100))

        const storedUser = localStorage.getItem("eventnest_user")
        console.log("[v0] Checking stored user:", storedUser ? "found" : "not found")

        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            console.log("[v0] Parsed user data:", userData)

            setUser({
              id: userData.id,
              usernumber: userData.usernumber,
              role: userData.role,
            })

            if (userData.profile) {
              setProfile(userData.profile)
            }

            console.log("[v0] User loaded from localStorage:", userData.usernumber, userData.role)
          } catch (error) {
            console.error("[v0] Error parsing stored user data:", error)
            localStorage.removeItem("eventnest_user")
          }
        } else {
          console.log("[v0] No stored user found")
        }
      } catch (error) {
        console.error("[v0] Error checking session:", error)
      } finally {
        setIsLoading(false)
        console.log("[v0] Auth loading complete")
      }
    }

    checkExistingSession()
  }, [])

  const login = (userData: CustomUser, profileData?: UserProfile) => {
    console.log("[v0] Login called with:", userData)
    setUser(userData)
    if (profileData) {
      setProfile(profileData)
    }
    // Store complete user data including profile
    const completeUserData = {
      ...userData,
      profile: profileData,
    }
    localStorage.setItem("eventnest_user", JSON.stringify(completeUserData))
    console.log("[v0] User data stored in localStorage")
  }

  const logout = () => {
    console.log("[v0] Logout called")
    localStorage.removeItem("eventnest_user")
    setUser(null)
    setProfile(null)
  }

  return <AuthContext.Provider value={{ user, profile, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
