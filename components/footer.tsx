import Link from "next/link"
import { Calendar } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">EventNest</h3>
              </div>
            </div>
            <p className="text-gray-600 text-sm">Christ University's premier event management platform</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/browse" className="block text-gray-600 hover:text-blue-600 text-sm">
                Browse Events
              </Link>
              <Link href="/dashboard" className="block text-gray-600 hover:text-blue-600 text-sm">
                My Dashboard
              </Link>
              <Link href="/help" className="block text-gray-600 hover:text-blue-600 text-sm">
                Help & Support
              </Link>
              <Link href="/about" className="block text-gray-600 hover:text-blue-600 text-sm">
                About Us
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Categories</h4>
            <div className="space-y-2">
              <Link href="/browse?category=technical" className="block text-gray-600 hover:text-blue-600 text-sm">
                Technical
              </Link>
              <Link href="/browse?category=cultural" className="block text-gray-600 hover:text-blue-600 text-sm">
                Cultural
              </Link>
              <Link href="/browse?category=sports" className="block text-gray-600 hover:text-blue-600 text-sm">
                Sports
              </Link>
              <Link href="/browse?category=academic" className="block text-gray-600 hover:text-blue-600 text-sm">
                Academic
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>events@christuniversity.in</p>
              <p>+91-80-4012-9100</p>
              <p>Bangalore, Karnataka</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-600 text-sm">© 2024 Christ University. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
