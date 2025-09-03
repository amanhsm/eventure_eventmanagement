"use client"

import Link from "next/link"
import { Calendar, Home, Search, User, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navigation() {
  const { user, profile, logout } = useAuth()

  const getDashboardLink = () => {
    if (!user) return "/dashboard"
    switch (user.role) {
      case "admin":
        return "/dashboard/admin"
      case "organizer":
        return "/dashboard/organizer"
      case "student":
        return "/dashboard/student"
      default:
        return "/dashboard"
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EventNest</h1>
            <p className="text-sm text-gray-600">Christ University</p>
          </div>
        </Link>

        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/browse"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Browse Events</span>
          </Link>
          {user && (
            <Link
              href={getDashboardLink()}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {profile ? profile.name.charAt(0).toUpperCase() : user.usernumber.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-gray-700 font-medium">{profile ? profile.name : user.usernumber}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors">Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
