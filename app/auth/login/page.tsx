import { LoginForm } from "@/components/auth/login-form"
import { Calendar } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">EventNest</h1>
              <p className="text-sm text-blue-200">Christ University</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-blue-200">Sign in with your university credentials</p>
        </div>

        <LoginForm />

        <div className="text-center mt-6">
          <p className="text-blue-200 text-sm">Contact IT support if you need help with your credentials</p>
        </div>
      </div>
    </div>
  )
}
