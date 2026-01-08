import React from 'react'
import AppSupabase from './AppSupabase' // Supabase version
import { WelcomePage } from './components/WelcomePage'
import AccessRequestForm from './components/AccessRequestForm'
import EnvCheck from './components/EnvCheck'
import SupabaseConnectionTest from './components/SupabaseConnectionTest'

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">გვერდი ვერ მოიძებნა</p>
        <div className="space-y-3">
          <a
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            მთავარ გვერდზე დაბრუნება
          </a>
          <a
            href="/request-access"
            className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            ტესტის მოთხოვნა
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Router() {
  const path = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)
  const testType = searchParams.get('type') as 'r' | 'nr' | null
  
  // Debug/test routes
  if (path === '/env-check') {
    return <EnvCheck />
  }
  
  if (path === '/connection-test') {
    return <SupabaseConnectionTest />
  }
  
  // Access request route
  if (path === '/request-access') {
    return <AccessRequestForm />
  }
  
  // App routes (admin, test, results)
  if (path.startsWith('/admin') || path.startsWith('/test/') || path.startsWith('/results/')) {
    return <AppSupabase />
  }
  
  // Homepage - handle test type from query parameter
  if (path === '/' && testType) {
    // Redirect to access request page
    window.location.href = '/request-access'
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">გადამისამართება...</p>
        </div>
      </div>
    )
  }
  
  // Homepage - show welcome page with navigation to access request
  if (path === '/') {
    return <WelcomePage onStart={() => window.location.href = '/request-access'} testType={testType} />
  }
  
  // 404 - Page not found
  return <NotFoundPage />
}