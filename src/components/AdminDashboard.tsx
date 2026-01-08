import React, { useState, useEffect } from 'react'
import { getAllAssessments, getTestStats, getAllProfiles, getAllAssessmentsWithDetailedAnswers, deleteAssessment, recalculateAllAssessments, generateTestLink, getAllTestLinks, revokeTestLink, getAllAccessRequests, approveAccessRequest, rejectAccessRequest } from '../lib/api'
import { Assessment, User, Profile, TestLink, AccessRequest } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { downloadFile, generateAnalyticsReport, generateDetailedCSVReport } from '../utils/reportGenerator'
import QuestionManager from './QuestionManager'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'results' | 'analytics' | 'questions'>('dashboard')
  const [assessments, setAssessments] = useState<(Assessment & { user: User })[]>([])
  const [stats, setStats] = useState({ totalTests: 0, profileDistribution: {}, recentTests: 0 })
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [testLinks, setTestLinks] = useState<TestLink[]>([])
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])

  // Link creation state
  const [showLinkCreator, setShowLinkCreator] = useState(false)
  const [linkShowResults, setLinkShowResults] = useState<boolean>(true)
  const [linkExpiration, setLinkExpiration] = useState<string>('1day')
  const [linkSingleUse, setLinkSingleUse] = useState<boolean>(true)
  const [generatedLink, setGeneratedLink] = useState<string>('')
  const [creatingLink, setCreatingLink] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('ინიციალიზაცია...')
  const [recalculating, setRecalculating] = useState(false)


  useEffect(() => {
    loadData()
  }, [])

  // Separate timeout effect
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.error('Loading timeout - forcing completion')
        setLoading(false)
      }, 10000) // 10 second timeout

      return () => clearTimeout(timeout)
    }
  }, [loading])

  const loadData = async () => {
    setLoading(true)
    setLoadingStatus('იწყება...')
    console.log('Starting loadData function...')

    try {
      console.log('Loading admin data...')

      // Load data one by one with individual error handling
      let assessmentsData: (Assessment & { user: User })[] = []
      try {
        setLoadingStatus('შეფასებების ჩატვირთვა...')
        console.log('Loading assessments...')
        assessmentsData = await getAllAssessments()
        console.log('Assessments loaded:', assessmentsData.length)
      } catch (err) {
        console.error('Failed to load assessments:', err)
      }

      let statsData = { totalTests: 0, profileDistribution: {}, recentTests: 0 }
      try {
        setLoadingStatus('სტატისტიკის ჩატვირთვა...')
        console.log('Loading stats...')
        statsData = await getTestStats()
        console.log('Stats loaded:', statsData)
      } catch (err) {
        console.error('Failed to load stats:', err)
      }

      let profilesData: Profile[] = []
      try {
        setLoadingStatus('პროფილების ჩატვირთვა...')
        console.log('Loading profiles...')
        profilesData = await getAllProfiles()
        console.log('Profiles loaded:', profilesData.length)
      } catch (err) {
        console.error('Failed to load profiles:', err)
      }

      let testLinksData: TestLink[] = []
      try {
        setLoadingStatus('ბმულების ჩატვირთვა...')
        console.log('Loading test links...')
        testLinksData = await getAllTestLinks()
        console.log('Test links loaded:', testLinksData.length)
      } catch (err) {
        console.error('Failed to load test links:', err)
      }

      let accessRequestsData: AccessRequest[] = []
      try {
        setLoadingStatus('მოთხოვნების ჩატვირთვა...')
        console.log('Loading access requests...')
        accessRequestsData = await getAllAccessRequests()
        console.log('Access requests loaded:', accessRequestsData.length)
      } catch (err) {
        console.error('Failed to load access requests:', err)
      }

      // Set all data even if some failed
      setLoadingStatus('დასრულება...')
      setAssessments(assessmentsData)
      setStats(statsData)
      setProfiles(profilesData)
      setTestLinks(testLinksData)
      setAccessRequests(accessRequestsData)

      console.log('All data loading completed')
    } catch (error) {
      console.error('Critical error in loadData:', error)
      setLoadingStatus('შეცდომა მოხდა')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }



  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    alert('ბმული დაკოპირდა!')
  }

  const getExpirationDate = (expiration: string): string | null => {
    if (expiration === 'unlimited') return null
    
    const now = new Date()
    const expirationMap: Record<string, number> = {
      '1hour': 1,
      '3hours': 3,
      '12hours': 12,
      '1day': 24,
      '3days': 72,
      '1week': 168,
      '2weeks': 336,
      '1month': 720,
      '3months': 2160,
      '1year': 8760
    }
    
    const hours = expirationMap[expiration]
    if (!hours) return null
    
    now.setHours(now.getHours() + hours)
    return now.toISOString()
  }

  const getExpirationLabel = (expiration: string): string => {
    const labelMap: Record<string, string> = {
      'unlimited': 'უვადო',
      '1hour': '1 საათი',
      '3hours': '3 საათი',
      '12hours': '12 საათი',
      '1day': '1 დღე',
      '3days': '3 დღე',
      '1week': '1 კვირა',
      '2weeks': '2 კვირა',
      '1month': '1 თვე',
      '3months': '3 თვე',
      '1year': '1 წელი'
    }
    return labelMap[expiration] || expiration
  }

  const handleCreateLink = async () => {
    setCreatingLink(true)
    setGeneratedLink('')

    try {
      const expiresAt = getExpirationDate(linkExpiration)
      const linkCode = await generateTestLink(linkShowResults, expiresAt, linkSingleUse)
      
      if (linkCode) {
        const fullLink = `${window.location.origin}/test/${linkCode}`
        setGeneratedLink(fullLink)
        
        // Refresh the links list
        const updatedLinks = await getAllTestLinks()
        setTestLinks(updatedLinks)
      } else {
        alert('ბმულის შექმნა ვერ მოხერხდა')
      }
    } catch (error) {
      console.error('Error creating link:', error)
      alert('ბმულის შექმნისას მოხდა შეცდომა')
    } finally {
      setCreatingLink(false)
    }
  }

  const handleRevokeLink = async (linkId: string, linkCode: string) => {
    if (!confirm(`ნამდვილად გსურთ ბმულის გაუქმება? (${linkCode})\nეს მოქმედება შეუქცევადია.`)) {
      return
    }

    try {
      const success = await revokeTestLink(linkId)
      if (success) {
        // Refresh the links list
        const updatedLinks = await getAllTestLinks()
        setTestLinks(updatedLinks)
        alert('ბმული წარმატებით გაუქმდა')
      } else {
        alert('ბმულის გაუქმება ვერ მოხერხდა')
      }
    } catch (error) {
      console.error('Error revoking link:', error)
      alert('ბმულის გაუქმებისას მოხდა შეცდომა')
    }
  }

  const getLinkStatus = (link: TestLink): { text: string; color: string } => {
    const now = new Date()
    
    // Check if expired
    if (link.expires_at) {
      const expiresAt = new Date(link.expires_at)
      if (now > expiresAt) {
        return { text: 'ვადაგასული', color: 'red' }
      }
    }
    
    // Check if used (for single-use links)
    if (link.single_use && link.is_used) {
      return { text: 'გამოყენებული', color: 'gray' }
    }
    
    return { text: 'აქტიური', color: 'green' }
  }

  const formatExpirationTime = (expiresAt: string | null | undefined): string => {
    if (!expiresAt) return 'უვადო'
    
    const date = new Date(expiresAt)
    const now = new Date()
    
    if (date < now) return 'ვადაგასული'
    
    return date.toLocaleString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleApproveRequest = async (requestId: string, email: string) => {
    try {
      // Generate non-expiring, single-use link with results shown
      const result = await approveAccessRequest(requestId, true, null, true)
      
      if (result.success && result.link) {
        const fullLink = `${window.location.origin}/test/${result.link}`
        
        // Copy link to clipboard
        await navigator.clipboard.writeText(fullLink)
        
        // Show success notification
        alert(`✓ ბმული შეიქმნა და დაკოპირდა!\n\nგაუგზავნეთ ეს ბმული მომხმარებელს:\n${email}\n\nბმული: ${fullLink}`)
        
        // Refresh data
        const updatedRequests = await getAllAccessRequests()
        setAccessRequests(updatedRequests)
      } else {
        alert('მოთხოვნის მიღება ვერ მოხერხდა')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      alert('მოთხოვნის მიღებისას მოხდა შეცდომა')
    }
  }

  const handleIgnoreRequest = async (requestId: string) => {
    try {
      const success = await rejectAccessRequest(requestId)
      
      if (success) {
        // Refresh data
        const updatedRequests = await getAllAccessRequests()
        setAccessRequests(updatedRequests)
      } else {
        alert('მოთხოვნის იგნორირება ვერ მოხერხდა')
      }
    } catch (error) {
      console.error('Error ignoring request:', error)
      alert('მოთხოვნის იგნორირებისას მოხდა შეცდომა')
    }
  }



  const downloadDetailedCSV = async () => {
    try {
      const data = await getAllAssessmentsWithDetailedAnswers()
      if (data.length === 0) {
        alert('No assessment data available')
        return
      }

      const csv = await generateDetailedCSVReport(data)
      const filename = `power3_detailed_data_${new Date().toISOString().split('T')[0]}.csv`

      downloadFile(csv, filename, 'text/csv')
    } catch (error) {
      console.error('Error downloading detailed CSV:', error)
      alert('Failed to download detailed data')
    }
  }

  const downloadAnalyticsReport = async () => {
    try {
      const report = generateAnalyticsReport(assessments)
      const filename = `power3_analytics_${new Date().toISOString().split('T')[0]}.txt`

      downloadFile(report, filename, 'text/plain')
    } catch (error) {
      console.error('Error downloading analytics report:', error)
      alert('Failed to download analytics report')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string, userName: string) => {
    if (!confirm(`ნამდვილად გსურთ ${userName}-ის შედეგის წაშლა? ეს მოქმედება შეუქცევადია.`)) {
      return
    }

    try {
      const success = await deleteAssessment(assessmentId)
      if (success) {
        // Refresh the data
        await loadData()
        alert('შედეგი წარმატებით წაიშალა')
      } else {
        alert('შედეგის წაშლა ვერ მოხერხდა')
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      alert('შედეგის წაშლისას მოხდა შეცდომა')
    }
  }

  const handleRecalculateAll = async () => {
    if (!confirm('ნამდვილად გსურთ ყველა შედეგის ხელახალი გამოთვლა? ეს შეცვლის არსებულ პერსონალობის ტიპებს.')) {
      return
    }

    try {
      setRecalculating(true)
      const count = await recalculateAllAssessments()
      await loadData() // Refresh the data
      alert(`წარმატებით გადაითვალა ${count} შედეგი`)
    } catch (error) {
      console.error('Error recalculating assessments:', error)
      alert('ხელახალი გამოთვლისას მოხდა შეცდომა')
    } finally {
      setRecalculating(false)
    }
  }



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-gray-600">{loadingStatus}</div>
        <div className="text-sm text-gray-500">
          თუ ეს ძალიან დიდხანს გრძელდება, შეამოწმეთ ბრაუზერის კონსოლი შეცდომებისთვის
        </div>
        <div className="flex gap-4 mt-4">
          <a
            href="/env-check"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            გარემოს შემოწმება
          </a>
          <a
            href="/connection-test"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            კავშირის ტესტი
          </a>
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            მთავარი გვერდი
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Power3 ლიდერობის ტესტი - ადმინისტრაცია</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                მოგესალმებით, {user?.email}
              </span>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
              >
                გასვლა
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'dashboard', label: 'ბმულები' },
              { key: 'requests', label: `მოთხოვნები ${accessRequests.filter(r => r.status === 'pending').length > 0 ? `(${accessRequests.filter(r => r.status === 'pending').length})` : ''}` },
              { key: 'results', label: 'შედეგები' },
              { key: 'analytics', label: 'ანალიტიკა' },
              { key: 'questions', label: 'კითხვების მართვა' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Link Creator */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">ახალი ტესტის ბმულის შექმნა</h3>
                <button
                  onClick={() => setShowLinkCreator(!showLinkCreator)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  {showLinkCreator ? 'დახურვა' : '+ ახალი ბმული'}
                </button>
              </div>

              {showLinkCreator && (
                <div className="border-t pt-4 space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        შედეგების ჩვენება
                      </label>
                      <select
                        value={linkShowResults ? 'yes' : 'no'}
                        onChange={(e) => setLinkShowResults(e.target.value === 'yes')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="yes">კი - აჩვენე შედეგები</option>
                        <option value="no">არა - არ აჩვენო შედეგები</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ვადის გასვლა
                      </label>
                      <select
                        value={linkExpiration}
                        onChange={(e) => setLinkExpiration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unlimited">უვადო</option>
                        <option value="1hour">1 საათი</option>
                        <option value="3hours">3 საათი</option>
                        <option value="12hours">12 საათი</option>
                        <option value="1day">1 დღე</option>
                        <option value="3days">3 დღე</option>
                        <option value="1week">1 კვირა</option>
                        <option value="2weeks">2 კვირა</option>
                        <option value="1month">1 თვე</option>
                        <option value="3months">3 თვე</option>
                        <option value="1year">1 წელი</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        გამოყენების რაოდენობა
                      </label>
                      <select
                        value={linkSingleUse ? 'single' : 'multiple'}
                        onChange={(e) => setLinkSingleUse(e.target.value === 'single')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="single">ერთჯერადი</option>
                        <option value="multiple">მრავალჯერადი</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateLink}
                    disabled={creatingLink}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {creatingLink ? 'იქმნება...' : 'ბმულის შექმნა'}
                  </button>

                  {generatedLink && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-800 mb-2">ბმული წარმატებით შეიქმნა!</p>
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          value={generatedLink}
                          readOnly
                          className="flex-1 px-3 py-2 border border-green-300 rounded-md bg-white text-sm font-mono"
                        />
                        <button
                          onClick={() => copyLink(generatedLink)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          კოპირება
                        </button>
                      </div>
                      <div className="text-xs text-green-700 space-y-1">
                        <p>• ვადა: {getExpirationLabel(linkExpiration)}</p>
                        <p>• გამოყენება: {linkSingleUse ? 'ერთჯერადი' : 'მრავალჯერადი'}</p>
                        <p>• შედეგები: {linkShowResults ? 'ნაჩვენები' : 'დამალული'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Legacy Links Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">ინფორმაცია:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>ერთჯერადი ბმული:</strong> შეიძლება გამოყენებულ იქნას მხოლოდ ერთხელ</li>
                <li>• <strong>მრავალჯერადი ბმული:</strong> შეიძლება გამოყენებულ იქნას მრავალჯერ ვადის გასვლამდე</li>
                <li>• <strong>უვადო ბმული:</strong> არასოდეს იწურება (მხოლოდ გამოყენების რაოდენობით შეიზღუდება)</li>
                <li>• თითოეული ბმული უნიკალურია და უზრუნველყოფს უსაფრთხოებას</li>
              </ul>
            </div>

            {/* Existing Links Management */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">არსებული ბმულები</h3>
                <p className="text-sm text-gray-500 mt-1">სულ {testLinks.length} ბმული</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ბმული
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        სტატუსი
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ტიპი
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ვადა
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        შედეგები
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        შექმნის თარიღი
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        მოქმედებები
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testLinks.map((link) => {
                      const status = getLinkStatus(link)
                      const fullLink = `${window.location.origin}/test/${link.link_code}`
                      
                      return (
                        <tr key={link.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {link.link_code.substring(0, 12)}...
                              </code>
                              <button
                                onClick={() => copyLink(fullLink)}
                                className="text-blue-600 hover:text-blue-800"
                                title="კოპირება"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              status.color === 'green' ? 'bg-green-100 text-green-800' :
                              status.color === 'red' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {link.single_use ? 'ერთჯერადი' : 'მრავალჯერადი'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatExpirationTime(link.expires_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {link.show_results_immediately ? 'ნაჩვენები' : 'დამალული'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(link.created_at).toLocaleDateString('ka-GE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleRevokeLink(link.id, link.link_code)}
                              className="text-red-600 hover:text-red-900"
                            >
                              გაუქმება და წაშლა
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {testLinks.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">ბმულები არ არის</h3>
                    <p className="mt-1 text-sm text-gray-500">შექმენით პირველი ბმული ზემოთ მოცემული ფორმით.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">წვდომის მოთხოვნები</h3>
              <p className="text-sm text-gray-500 mt-1">
                სულ {accessRequests.length} მოთხოვნა 
                ({accessRequests.filter(r => r.status === 'pending').length} განხილვაში)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      მომხმარებელი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ელ. ფოსტა
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ორგანიზაცია
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      შეტყობინება
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      სტატუსი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      თარიღი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      მოქმედებები
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accessRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.first_name} {request.last_name}
                          </div>
                          {request.phone && (
                            <div className="text-sm text-gray-500">{request.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.organization || '-'}
                      </td>
                      <td className="px-6 py-4 max-w-xs relative">
                        {request.message ? (
                          <div className="group">
                            <div className="text-sm text-gray-700 truncate cursor-help">
                              {request.message}
                            </div>
                            <div className="invisible group-hover:visible fixed z-[9999] w-80 p-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl pointer-events-none transform -translate-x-1/2 left-1/2 mt-2">
                              <div className="break-words whitespace-normal">
                                {request.message}
                              </div>
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' ? 'განხილვაში' :
                           request.status === 'approved' ? 'მიღებული' :
                           'იგნორირებული'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{new Date(request.created_at).toLocaleDateString('ka-GE')}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(request.created_at).toLocaleTimeString('ka-GE')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveRequest(request.id, request.email)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              მიღება
                            </button>
                            <button
                              onClick={() => handleIgnoreRequest(request.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              იგნორი
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {request.reviewed_at && (
                              <div>
                                {new Date(request.reviewed_at).toLocaleDateString('ka-GE')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {accessRequests.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">მოთხოვნები არ არის</h3>
                  <p className="mt-1 text-sm text-gray-500">მომხმარებლები შეძლებენ წვდომის მოთხოვნას მთავარი გვერდიდან.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">ტესტის შედეგები</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRecalculateAll}
                  disabled={recalculating}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
                >
                  {recalculating ? 'გამოთვლა...' : 'ყველას ხელახალი გამოთვლა'}
                </button>
                <span className="text-sm text-gray-500 flex items-center">
                  სულ {assessments.length} შედეგი
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      სახელი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      პროფილი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ქულები
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      თარიღი
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      მოქმედებები
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assessment.user.first_name} {assessment.user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ასაკი: {assessment.user.age || '?'}, გამოცდილება: {assessment.user.leadership_experience || '?'} წელი
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assessment.personality_type
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {assessment.personality_type || 'მუშავდება...'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>V: {assessment.vision_score?.toFixed(1) || 'N/A'}</div>
                          <div>P: {assessment.people_score?.toFixed(1) || 'N/A'}</div>
                          <div>E: {assessment.execution_score?.toFixed(1) || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{new Date(assessment.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(assessment.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={`/results/${assessment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            რეპორტის ნახვა
                          </a>
                          <button
                            onClick={() => copyLink(`${window.location.origin}/results/${assessment.id}`)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            ბმულის კოპირება
                          </button>
                          <button
                            onClick={() => handleDeleteAssessment(assessment.id, `${assessment.user.first_name} ${assessment.user.last_name}`)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            წაშლა
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {assessments.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">ჯერ არ არის შეფასებები</h3>
                  <p className="mt-1 text-sm text-gray-500">დაიწყეთ მთავარ ტაბში ტესტის ბმულების გამოყენებით.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <QuestionManager />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Data Export Section */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">მონაცემების ექსპორტი და ანალიტიკა</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={downloadDetailedCSV}
                  className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ყველა მონაცემის გადმოწერა
                </button>

                <button
                  onClick={downloadAnalyticsReport}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  სრული ანალიტიკა
                </button>

                <div className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-600 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  სულ: {stats.totalTests}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">ექსპორტის ინფორმაცია:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>ყველა მონაცემის გადმოწერა:</strong> სრული CSV ფაილი ყველა მომხმარებლის ყველა კითხვაზე პასუხით, პირადი ინფორმაციით და შედეგებით</li>
                  <li>• <strong>სრული ანალიტიკა:</strong> დეტალური სტატისტიკური რეპორტი განაწილებებისა და ანალიზის ჩათვლით</li>
                  <li>• <strong>ინდივიდუალური რეპორტები:</strong> ხელმისაწვდომია შედეგების ტაბიდან თითოეული შეფასებისთვის</li>
                </ul>
              </div>
            </div>

            {/* Profile Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">პროფილების განაწილება</h3>
              <div className="space-y-3">
                {Object.entries(stats.profileDistribution).map(([profileCode, count]) => {
                  const profile = profiles.find(p => p.code === profileCode)
                  const countNum = count as number
                  const percentage = stats.totalTests > 0 ? (countNum / stats.totalTests * 100).toFixed(1) : '0.0'

                  return (
                    <div key={profileCode} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{profile?.title || profileCode}</span>
                        <span className="text-sm text-gray-500 ml-2">({profileCode})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {countNum} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>


          </div>
        )}


      </div>
    </div>
  )
}