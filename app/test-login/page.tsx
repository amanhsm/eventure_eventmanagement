"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabase = createClient()

      // Test the verify_user function
      const { data, error } = await supabase.rpc("verify_user", {
        p_usernumber: "1234567",
        p_user_type: "student", 
        p_password: "password123"
      })

      setResult({
        data,
        error,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setResult({
        error: err,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const testDirectQuery = async () => {
    setLoading(true)
    setResult(null)

    try {
      const supabase = createClient()

      // Test direct query to users table
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("usernumber", "1234567")
        .eq("user_type", "student")

      setResult({
        data,
        error,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setResult({
        error: err,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Login Debug Page</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test verify_user RPC"}
        </button>

        <button
          onClick={testDirectQuery}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? "Testing..." : "Test Direct Users Query"}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-yellow-50 p-4 rounded">
        <h3 className="font-bold mb-2">Test Credentials:</h3>
        <ul className="text-sm space-y-1">
          <li><strong>Student:</strong> 1234567 / password123</li>
          <li><strong>Organizer:</strong> 7654321 / password123</li>
          <li><strong>Admin:</strong> admin / password123</li>
        </ul>
      </div>
    </div>
  )
}

