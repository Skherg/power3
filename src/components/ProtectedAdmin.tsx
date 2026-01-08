import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export default function ProtectedAdmin() {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">ავტორიზაციის შემოწმება...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <AdminLogin onLoginSuccess={() => {}} />
  }

  return <AdminDashboard />
}