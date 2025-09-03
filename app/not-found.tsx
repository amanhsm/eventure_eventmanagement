import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            <Link href="/browse">
              <Button
                variant="outline"
                className="w-full bg-transparent hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
