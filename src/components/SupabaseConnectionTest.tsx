import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseConnectionTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      // Test 1: Basic connection
      console.log('Testing basic connection...')
      const { data: connectionTest, error: connectionError } = await supabase
        .from('questions')
        .select('count')
        .limit(1)
      
      if (connectionError) {
        setTestResult(`Connection failed: ${connectionError.message}`)
        return
      }
      
      console.log('Connection test passed')
      
      // Test 2: User creation
      console.log('Testing user creation...')
      const testUserData = {
        first_name: 'Test',
        last_name: 'User',
        age: 25
      }
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert(testUserData)
        .select()
        .single()
      
      if (userError) {
        setTestResult(`User creation failed: ${userError.message}\nDetails: ${JSON.stringify(userError, null, 2)}`)
        return
      }
      
      console.log('User creation test passed:', userData)
      
      // Test 3: Assessment creation
      console.log('Testing assessment creation...')
      const testAssessmentData = {
        user_id: userData.id,
        answers: { 'test_question': 5 }
      }
      
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert(testAssessmentData)
        .select()
        .single()
      
      if (assessmentError) {
        setTestResult(`Assessment creation failed: ${assessmentError.message}\nDetails: ${JSON.stringify(assessmentError, null, 2)}`)
        return
      }
      
      console.log('Assessment creation test passed:', assessmentData)
      
      // Clean up test data
      await supabase.from('assessments').delete().eq('id', assessmentData.id)
      await supabase.from('users').delete().eq('id', userData.id)
      
      setTestResult('All tests passed! ✅')
      
    } catch (err) {
      console.error('Test error:', err)
      setTestResult(`Test error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Connection Test'}
      </button>
      
      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
        </div>
      )}
    </div>
  )
}