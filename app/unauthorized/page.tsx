import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, LogIn } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please check your account role or contact an administrator.
          </p>
          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="w-full bg-transparent hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In with Different Account
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
