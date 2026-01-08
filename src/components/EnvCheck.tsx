import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function ConnectionTest() {
  const [status, setStatus] = useState('Testing...')
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('questions').select('count').limit(1)
        if (error) {
          setStatus(`❌ Error: ${error.message}`)
        } else {
          setStatus('✅ Connection successful')
        }
      } catch (err: any) {
        setStatus(`❌ Exception: ${err.message}`)
      }
    }
    
    testConnection()
  }, [])
  
  return <p className="font-mono text-sm bg-gray-100 p-2 rounded">{status}</p>
}

export default function EnvCheck() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Check</h1>
      
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <h3 className="font-semibold">VITE_SUPABASE_URL:</h3>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">
            {supabaseUrl || 'NOT SET'}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold">VITE_SUPABASE_ANON_KEY:</h3>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">
            {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET'}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold">Environment:</h3>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">
            {import.meta.env.MODE}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold">Connection Test:</h3>
          <ConnectionTest />
        </div>
        
        <div>
          <h3 className="font-semibold">All Environment Variables:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(import.meta.env, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-6 space-x-4">
        <a href="/connection-test" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Connection Test
        </a>
        <a href="/admin" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Admin Dashboard
        </a>
        <a href="/" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          Home
        </a>
      </div>
    </div>
  )
}