import React, { useState, useEffect } from 'react'
import { getPublicAssessmentResults, getQuestions } from '../lib/api'
import { Assessment, User, Profile, Question } from '../lib/supabase'
import { ResultsPage } from './ResultsPage'
import { AssessmentResults } from '../types/Assessment'
import { calculateAssessmentResults } from '../utils/calculations'

interface TestResultsPageProps {
  assessmentId: string
}

export default function TestResultsPage({ assessmentId }: TestResultsPageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [assessmentData, setAssessmentData] = useState<{
    assessment: Assessment & { user: User }
    profile: Profile | null
  } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  // Update document title when assessment data is loaded
  useEffect(() => {
    if (assessmentData?.assessment?.user) {
      const fullName = `${assessmentData.assessment.user.first_name} ${assessmentData.assessment.user.last_name}`
      document.title = `Power3 შედეგი - ${fullName}`
    }
    return () => {
      document.title = 'Power3 Leadership Test' // Reset title when component unmounts
    }
  }, [assessmentData])

  useEffect(() => {
    loadAssessmentResults()
  }, [assessmentId])

  const loadAssessmentResults = async () => {
    try {
      setLoading(true)
      setError('') // Clear any previous errors

      console.log('Loading assessment results for ID:', assessmentId)

      if (!assessmentId || assessmentId.trim() === '') {
        setError('Invalid assessment ID')
        return
      }

      // Load both assessment data and questions
      const [data, questionsData] = await Promise.all([
        getPublicAssessmentResults(assessmentId),
        getQuestions()
      ])
      
      console.log('Assessment data received:', data)
      console.log('Questions loaded:', questionsData.length)

      if (!data) {
        setError('Assessment not found')
        return
      }

      if (!data.assessment) {
        setError('Assessment data is incomplete')
        return
      }

      if (!data.assessment.user) {
        setError('User data not found for this assessment')
        return
      }

      if (!data.assessment.answers || Object.keys(data.assessment.answers).length === 0) {
        setError('No assessment answers found')
        return
      }

      setAssessmentData(data)
      setQuestions(questionsData)
    } catch (err) {
      console.error('Error loading assessment results:', err)
      setError(`Failed to load assessment results: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRetake = () => {
    // For results page, we don't allow retaking - redirect to home
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">შედეგების ჩატვირთვა...</p>
        </div>
      </div>
    )
  }

  if (error || !assessmentData || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100">
        <div className="text-center max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">შეცდომა</h2>
          <p className="text-gray-600 mb-6">{error || (questions.length === 0 ? 'კითხვები ვერ ჩაიტვირთა' : 'შეფასება ვერ მოიძებნა')}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              თავიდან ცდა
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              მთავარ გვერდზე დაბრუნება
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Convert assessment data to AssessmentResults format
  let results: AssessmentResults
  try {
    console.log('Calculating results from answers:', assessmentData.assessment.answers)
    
    // Reconstruct self-assessment from stored data
    const selfAssessment = {
      vision: assessmentData.assessment.vision_self || 33.33,
      people: assessmentData.assessment.people_self || 33.33,
      execution: assessmentData.assessment.execution_self || 33.34,
      extraversion: 50 // Default value, will be overridden by calculation
    }
    
    results = calculateAssessmentResults(
      assessmentData.assessment.answers,
      selfAssessment,
      questions
    )
    
    // IMPORTANT: Use the stored personality type from the database instead of the calculated one
    // This ensures consistency with what admins see in the dashboard
    if (assessmentData.assessment.personality_type) {
      results.personalityType = assessmentData.assessment.personality_type
    }
    
    console.log('Calculated results with stored personality type:', results)
  } catch (err) {
    console.error('Error calculating assessment results:', err)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100">
        <div className="text-center max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">გამოთვლის შეცდომა</h2>
          <p className="text-gray-600 mb-6">შედეგების გამოთვლა ვერ მოხერხდა</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              თავიდან ცდა
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              მთავარ გვერდზე დაბრუნება
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fullName = `${assessmentData.assessment.user.first_name} ${assessmentData.assessment.user.last_name}`

  return (
    <ResultsPage
      results={results}
      onRetake={handleRetake}
      userName={fullName}
    />
  )
}