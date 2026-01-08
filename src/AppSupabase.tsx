import React from 'react'
import TestTaker from './components/TestTaker'
import ProtectedAdmin from './components/ProtectedAdmin'
import TestResultsPage from './components/TestResultsPage'
import { AuthProvider } from './contexts/AuthContext'

function LoadingRedirect({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  )
}

function AppSupabase() {
  // Simple routing based on URL path
  const path = window.location.pathname
  const isAdmin = path.startsWith('/admin')
  const isTest = path.startsWith('/test/')
  const isResults = path.startsWith('/results/')
  
  if (isAdmin) {
    return (
      <AuthProvider>
        <ProtectedAdmin />
      </AuthProvider>
    )
  }
  
  if (isTest) {
    const linkCode = path.split('/test/')[1]
    if (linkCode) {
      return <TestTaker linkCode={linkCode} />
    } else {
      // Redirect to home for invalid test links
      window.location.href = '/'
      return <LoadingRedirect message="არასწორი ტესტის ბმული..." />
    }
  }

  if (isResults) {
    const assessmentId = path.split('/results/')[1]
    if (assessmentId) {
      return <TestResultsPage assessmentId={assessmentId} />
    } else {
      // Redirect to home for invalid results links
      window.location.href = '/'
      return <LoadingRedirect message="არასწორი შედეგების ბმული..." />
    }
  }

  // Redirect to home for unmatched paths
  window.location.href = '/'
  return <LoadingRedirect message="გადამისამართება..." />
}

export default AppSupabase