import React, { useState, useEffect } from 'react'
import { createUser, getQuestions, submitAssessmentWithSelfAssessment } from '../lib/api'
import { Question, User } from '../lib/supabase'
import { QuestionPage } from './QuestionPage'
import { SelfAssessmentPage } from './SelfAssessment'

import { Question as AssessmentQuestion, QuestionResponse, SelfAssessment } from '../types/Assessment'

interface TestTakerProps {
  linkCode: string
}

export default function TestTaker({ linkCode }: TestTakerProps) {
  const [step, setStep] = useState<'validate' | 'self-assessment' | 'personal-info' | 'questions' | 'results' | 'error'>('validate')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [user, setUser] = useState<User | null>(null)
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment>({
    vision: 33.33,
    people: 33.33,
    execution: 33.34,
    extraversion: 50
  })

  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string>('')
  const [allowResultsDisplay, setAllowResultsDisplay] = useState(false)

  // Personal info form state
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    age: '',
    gender: '',
    leadership_experience: ''
  })

  useEffect(() => {
    initializeTest()
  }, [linkCode])

  const initializeTest = async () => {
    // Validate link code with the API
    try {
      const { validateTestLink, getEffectiveShowResultsSetting } = await import('../lib/api')
      const testLink = await validateTestLink(linkCode)
      
      if (!testLink) {
        setError('ბმული არასწორია, უკვე გამოყენებულია ან ვადაგასულია')
        setStep('error')
        return
      }

      // Get the show results setting for this link
      const shouldShowResults = await getEffectiveShowResultsSetting(linkCode)
      setAllowResultsDisplay(shouldShowResults)

      // Load questions and start test
      const questionsData = await getQuestions()
      setQuestions(questionsData)
      setStep('self-assessment')
    } catch (err) {
      console.error('Error validating test link:', err)
      setError('ბმულის შემოწმებისას მოხდა შეცდომა')
      setStep('error')
    }
  }

  const handleSelfAssessmentComplete = (assessment: SelfAssessment) => {
    setSelfAssessment(assessment)

    if (allowResultsDisplay) {
      // For results link: self assessment -> questions -> personal info -> results
      setStep('questions')
    } else {
      // For no-results link: self assessment -> personal info -> questions -> thank you
      setStep('personal-info')
    }
  }

  const handleBackToSelfAssessment = () => {
    setStep('self-assessment')
  }

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!personalInfo.first_name.trim() || !personalInfo.last_name.trim() || !personalInfo.age.trim() || !personalInfo.gender.trim() || !personalInfo.leadership_experience.trim()) {
      setError('ყველა ველი აუცილებელია შესავსებად')
      return
    }

    // Validate age
    const age = parseInt(personalInfo.age)
    if (isNaN(age) || age < 18 || age > 100) {
      setError('ასაკი უნდა იყოს 18-დან 100 წლამდე')
      return
    }

    // Validate leadership experience
    const experience = parseInt(personalInfo.leadership_experience)
    if (isNaN(experience) || experience < 0 || experience > 50) {
      setError('ლიდერობის გამოცდილება უნდა იყოს 0-დან 50 წლამდე')
      return
    }

    const userData = {
      first_name: personalInfo.first_name.trim(),
      last_name: personalInfo.last_name.trim(),
      age,
      gender: personalInfo.gender,
      leadership_experience: experience
    }

    const newUser = await createUser(userData)
    if (!newUser) {
      setError('Failed to create user')
      setStep('error')
      return
    }

    setUser(newUser)

    if (allowResultsDisplay) {
      // For results link: personal info collected after questions, now submit and show results
      const newAssessment = await submitAssessmentWithSelfAssessment(newUser, answers, selfAssessment)
      if (!newAssessment) {
        setError('Failed to submit assessment')
        setStep('error')
        return
      }

      // Mark link as used if it's a single-use link
      const { validateTestLink, markTestLinkAsUsed } = await import('../lib/api')
      const testLink = await validateTestLink(linkCode)
      if (testLink?.single_use) {
        await markTestLinkAsUsed(linkCode)
      }

      // Redirect to persistent results page
      window.location.href = `/results/${newAssessment.id}`
    } else {
      // For no-results link: personal info collected first, now start questions
      setStep('questions')
    }
  }

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmitAssessment()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitAssessment = async () => {
    if (allowResultsDisplay) {
      // For results link: questions are done, now collect personal info
      setStep('personal-info')
    } else {
      // For no-results link: user info already collected, submit assessment
      if (!user) return

      const newAssessment = await submitAssessmentWithSelfAssessment(user, answers, selfAssessment)
      if (!newAssessment) {
        setError('Failed to submit assessment')
        setStep('error')
        return
      }

      // Mark link as used if it's a single-use link
      const { validateTestLink, markTestLinkAsUsed } = await import('../lib/api')
      const testLink = await validateTestLink(linkCode)
      if (testLink?.single_use) {
        await markTestLinkAsUsed(linkCode)
      }

      // Show thank you message
      setShowResults(false)
      setStep('results')
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (step === 'validate') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (step === 'self-assessment') {
    return (
      <SelfAssessmentPage
        onNext={handleSelfAssessmentComplete}
        onBack={() => {
          // Go back to homepage with the test type parameter
          window.location.href = `/?type=${linkCode}`
        }}
      />
    )
  }

  if (step === 'personal-info') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20" style={{ backgroundColor: '#241f3f' }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20" style={{ backgroundColor: '#46ac50' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#e43159' }}></div>
        </div>

        <div className="relative flex items-center justify-center min-h-screen p-4">
          <div className="max-w-2xl w-full">
            {/* Header with Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-6">
                <img
                  src="https://i.ibb.co/bc9xNqL/pwr3-logo-tr.png"
                  alt="POWER3 Logo"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                პირადი <span style={{ color: '#46ac50' }}>ინფორმაცია</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-xl mx-auto mb-6">
                {allowResultsDisplay
                  ? 'გთხოვთ შეავსოთ თქვენი პირადი ინფორმაცია შედეგების სანახავად'
                  : 'გთხოვთ შეავსოთ თქვენი პირადი ინფორმაცია'
                }
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50">
              {error && (
                <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: '#e4315920', borderColor: '#e43159', color: '#e43159' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      სახელი *
                    </label>
                    <input
                      type="text"
                      required
                      value={personalInfo.first_name}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                      placeholder="შეიყვანეთ თქვენი სახელი"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      გვარი *
                    </label>
                    <input
                      type="text"
                      required
                      value={personalInfo.last_name}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                      placeholder="შეიყვანეთ თქვენი გვარი"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-6"></div>

                {/* Age and Gender */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      ასაკი *
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      required
                      value={personalInfo.age}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                      placeholder="25"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      სქესი *
                    </label>
                    <select
                      required
                      value={personalInfo.gender}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                    >
                      <option value="">აირჩიეთ სქესი</option>
                      <option value="მამრობითი">მამრობითი</option>
                      <option value="მდედრობითი">მდედრობითი</option>
                      <option value="არ მსურს გაზიარება">არ მსურს გაზიარება</option>
                    </select>
                  </div>
                </div>

                {/* Leadership Experience */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ლიდერობის გამოცდილება (წლები) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={personalInfo.leadership_experience}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, leadership_experience: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all duration-200"
                    placeholder="მაგ: 5"
                  />
                </div>

                {/* Required Fields Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">შენიშვნა:</span> ველები რომლებიც მონიშნულია ვარსკვლავით (*) აუცილებელია შესავსებად.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold transition-colors"
                >
                  {allowResultsDisplay ? 'შედეგების ნახვა' : 'კითხვებზე გადასვლა'}
                </button>
              </form>
            </div>

            {/* Privacy Note */}
            <div className="text-center mt-6">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  🔒 თქვენი პირადი ინფორმაცია დაცულია და გამოიყენება მხოლოდ ტესტის შედეგების ანალიზისთვის.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'questions' && currentQuestion) {
    // Convert Supabase Question to Assessment Question format
    const assessmentQuestion: AssessmentQuestion = {
      id: currentQuestion.id,
      domain: currentQuestion.domain as 'Vision' | 'People' | 'Execution' | 'E/I',
      component: currentQuestion.component,
      text: currentQuestion.text,
      tag: currentQuestion.tag
    }

    // Convert answers to responses format for QuestionPage
    const responses: QuestionResponse[] = Object.entries(answers).map(([questionId, score]) => ({
      questionId,
      score
    }))

    return (
      <QuestionPage
        question={assessmentQuestion}
        currentIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        responses={responses}
        onAnswer={handleAnswerChange}
        onNext={handleNextQuestion}
        onPrevious={currentQuestionIndex === 0 ? handleBackToSelfAssessment : handlePreviousQuestion}
        onFinish={handleSubmitAssessment}
      />
    )
  }

  if (step === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-teal-100 to-green-100 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20" style={{ backgroundColor: '#241f3f' }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20" style={{ backgroundColor: '#46ac50' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#e43159' }}></div>
        </div>

        <div className="relative flex items-center justify-center min-h-screen p-4">
          <div className="max-w-4xl w-full">
            {/* Header with Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-6">
                <img
                  src="https://i.ibb.co/bc9xNqL/pwr3-logo-tr.png"
                  alt="POWER3 Logo"
                  className="w-20 h-20 object-contain"
                />
              </div>

              {showResults ? (
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                    თქვენი <span style={{ color: '#46ac50' }}>შედეგები</span>
                  </h1>
                  <p className="text-lg text-slate-600 max-w-xl mx-auto mb-6">
                    გილოცავთ ტესტის წარმატებით დასრულებას!
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                    <span style={{ color: '#46ac50' }}>მადლობა!</span>
                  </h1>
                  <p className="text-lg text-slate-600 max-w-xl mx-auto mb-6">
                    გმადლობთ ტესტში მონაწილეობისთვის. თქვენი შედეგები მალე იქნება ხელმისაწვდომი.
                  </p>
                </div>
              )}
            </div>

            {/* Results Card */}
            {showResults ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">შედეგები ხელმისაწვდომია!</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">თქვენი ტესტის შედეგები მზადაა სანახავად.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">
                    ტესტი წარმატებით დასრულდა!
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    თქვენი პასუხები შენახულია და ანალიზდება. შედეგები მალე იქნება ხელმისაწვდომი.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">რჩევა:</span> შედეგების მისაღებად დაუკავშირდით ადმინისტრაციას ან დაელოდეთ ელექტრონული ფოსტით შეტყობინებას.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-8">
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="text-sm text-slate-600">
                  🔒 თქვენი ინფორმაცია დაცულია და კონფიდენციალურია
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}