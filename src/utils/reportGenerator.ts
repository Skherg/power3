import { Assessment, User, Profile } from '../lib/supabase'

export interface ReportData {
  assessment: Assessment & { user: User }
  profile: Profile | null
}

export function generateCSVReport(data: ReportData[]): string {
  const headers = [
    'Assessment ID',
    'First Name',
    'Last Name',
    'Age',
    'Gender',
    'Leadership Experience (Years)',
    'Personality Type',
    'Vision Score',
    'People Score',
    'Execution Score',
    'Extraversion Score',
    'Introversion Score',
    'Vision Self-Report (%)',
    'People Self-Report (%)',
    'Execution Self-Report (%)',
    'Profile Title',
    'Style Name',
    'Dominant Orientation',
    'Supporting Orientation',
    'Blind Spot',
    'Test Date',
    'Test Time',
    'Strengths',
    'Development Areas',
    'Potential Pitfalls'
  ]

  const csvRows = [headers.join(',')]

  data.forEach(({ assessment, profile }) => {
    const testDate = new Date(assessment.created_at)
    const row = [
      assessment.id,
      `"${assessment.user.first_name}"`,
      `"${assessment.user.last_name}"`,
      assessment.user.age || '',
      `"${assessment.user.gender || ''}"`,
      assessment.user.leadership_experience || '',
      `"${assessment.personality_type || ''}"`,
      assessment.vision_score?.toFixed(2) || '',
      assessment.people_score?.toFixed(2) || '',
      assessment.execution_score?.toFixed(2) || '',
      assessment.extraversion_score?.toFixed(2) || '',
      assessment.introversion_score?.toFixed(2) || '',
      assessment.vision_self?.toFixed(2) || '',
      assessment.people_self?.toFixed(2) || '',
      assessment.execution_self?.toFixed(2) || '',
      `"${profile?.title || ''}"`,
      `"${profile?.style_name || ''}"`,
      `"${profile?.dominant_orientation || ''}"`,
      `"${profile?.supporting_orientation || ''}"`,
      `"${profile?.blind_spot || ''}"`,
      testDate.toISOString().split('T')[0],
      testDate.toTimeString().split(' ')[0],
      `"${profile?.strengths.join('; ') || ''}"`,
      `"${profile?.development_areas.join('; ') || ''}"`,
      `"${profile?.pitfalls.join('; ') || ''}"`
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export async function generateDetailedCSVReport(assessments: (Assessment & { user: User })[]): Promise<string> {
  // Get all profiles and questions to include in the report
  const { getAllProfiles, getQuestions } = await import('../lib/api')
  const profiles = await getAllProfiles()
  const questions = await getQuestions()

  // Create headers with user info, scores, profile details, and all questions
  const headers = [
    'Assessment ID',
    'First Name',
    'Last Name',
    'Age',
    'Gender',
    'Leadership Experience (Years)',
    'Personality Type',
    'Vision Score',
    'People Score',
    'Execution Score',
    'Extraversion Score',
    'Introversion Score',
    'Vision Self-Report (%)',
    'People Self-Report (%)',
    'Execution Self-Report (%)',
    'Profile Title',
    'Style Name',
    'Dominant Orientation',
    'Supporting Orientation',
    'Blind Spot',
    'Profile Description',
    'Strengths',
    'Development Areas',
    'Potential Pitfalls',
    'Test Date',
    'Test Time',
    ...questions.map(q => `"${q.id}: ${q.text.substring(0, 50)}..."`)
  ]

  const csvRows = [headers.join(',')]

  assessments.forEach(assessment => {
    const testDate = new Date(assessment.created_at)

    const answers = assessment.answers || {}

    // Find the profile for this assessment
    const profile = assessment.personality_type
      ? profiles.find(p => p.code === assessment.personality_type)
      : null

    const row = [
      assessment.id,
      `"${assessment.user.first_name}"`,
      `"${assessment.user.last_name}"`,
      assessment.user.age || '',
      `"${assessment.user.gender || ''}"`,
      assessment.user.leadership_experience || '',
      `"${assessment.personality_type || ''}"`,
      assessment.vision_score?.toFixed(2) || '',
      assessment.people_score?.toFixed(2) || '',
      assessment.execution_score?.toFixed(2) || '',
      assessment.extraversion_score?.toFixed(2) || '',
      assessment.introversion_score?.toFixed(2) || '',
      assessment.vision_self?.toFixed(2) || '',
      assessment.people_self?.toFixed(2) || '',
      assessment.execution_self?.toFixed(2) || '',
      `"${profile?.title || ''}"`,
      `"${profile?.style_name || ''}"`,
      `"${profile?.dominant_orientation || ''}"`,
      `"${profile?.supporting_orientation || ''}"`,
      `"${profile?.blind_spot || ''}"`,
      `"${profile?.description || ''}"`,
      `"${profile?.strengths.join('; ') || ''}"`,
      `"${profile?.development_areas.join('; ') || ''}"`,
      `"${profile?.pitfalls.join('; ') || ''}"`,
      testDate.toISOString().split('T')[0],
      testDate.toTimeString().split(' ')[0],
      ...questions.map(q => answers[q.id] || '')
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

export function generateIndividualReport(data: ReportData): string {
  const { assessment, profile } = data
  const user = assessment.user

  const report = `
POWER3 Leadership Assessment Report
==================================

Personal Information:
- Name: ${user.first_name} ${user.last_name}
- Age: ${user.age || 'Not provided'}
- Gender: ${user.gender || 'Not provided'}
- Leadership Experience: ${user.leadership_experience || 'Not provided'} years
- Assessment Date: ${new Date(assessment.created_at).toLocaleDateString()}

Assessment Results:
- Personality Type: ${assessment.personality_type || 'Processing...'}
- Vision Score: ${assessment.vision_score?.toFixed(2) || 'N/A'}
- People Score: ${assessment.people_score?.toFixed(2) || 'N/A'}
- Execution Score: ${assessment.execution_score?.toFixed(2) || 'N/A'}
- Extraversion Score: ${assessment.extraversion_score?.toFixed(2) || 'N/A'}
- Introversion Score: ${assessment.introversion_score?.toFixed(2) || 'N/A'}

Self-Assessment (Self-Reported):
- Vision: ${assessment.vision_self?.toFixed(2) || 'N/A'}%
- People: ${assessment.people_self?.toFixed(2) || 'N/A'}%
- Execution: ${assessment.execution_self?.toFixed(2) || 'N/A'}%

${profile ? `
Profile Details:
- Title: ${profile.title}
- Style Name: ${profile.style_name}
- Dominant Orientation: ${profile.dominant_orientation}
- Supporting Orientation: ${profile.supporting_orientation}
- Blind Spot: ${profile.blind_spot}

Description:
${profile.description}

Strengths:
${profile.strengths.map(s => `• ${s}`).join('\n')}

Development Areas:
${profile.development_areas.map(d => `• ${d}`).join('\n')}

Potential Pitfalls:
${profile.pitfalls.map(p => `• ${p}`).join('\n')}
` : 'Profile information not available.'}

---
Generated by POWER3 Leadership Assessment System
`.trim()

  return report
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  try {
    // Add BOM for CSV files to ensure proper encoding
    const bom = mimeType === 'text/csv' ? '\uFEFF' : ''
    const blob = new Blob([bom + content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw new Error('Failed to download file')
  }
}

export function generateAnalyticsReport(assessments: (Assessment & { user: User })[]): string {
  const totalTests = assessments.length

  // Profile distribution
  const profileDistribution: Record<string, number> = {}
  assessments.forEach(assessment => {
    if (assessment.personality_type) {
      profileDistribution[assessment.personality_type] = (profileDistribution[assessment.personality_type] || 0) + 1
    }
  })

  // Age distribution
  const ageGroups: Record<string, number> = {
    '18-25': 0,
    '26-35': 0,
    '36-45': 0,
    '46-55': 0,
    '56+': 0,
    'Not specified': 0
  }

  assessments.forEach(assessment => {
    const age = assessment.user.age
    if (!age) {
      ageGroups['Not specified']++
    } else if (age <= 25) {
      ageGroups['18-25']++
    } else if (age <= 35) {
      ageGroups['26-35']++
    } else if (age <= 45) {
      ageGroups['36-45']++
    } else if (age <= 55) {
      ageGroups['46-55']++
    } else {
      ageGroups['56+']++
    }
  })

  // Gender distribution
  const genderDistribution: Record<string, number> = {}
  assessments.forEach(assessment => {
    const gender = assessment.user.gender || 'Not specified'
    genderDistribution[gender] = (genderDistribution[gender] || 0) + 1
  })

  // Leadership experience distribution
  const experienceGroups: Record<string, number> = {
    '0-2 years': 0,
    '3-5 years': 0,
    '6-10 years': 0,
    '11-15 years': 0,
    '16+ years': 0,
    'Not specified': 0
  }

  assessments.forEach(assessment => {
    const exp = assessment.user.leadership_experience
    if (!exp) {
      experienceGroups['Not specified']++
    } else if (exp <= 2) {
      experienceGroups['0-2 years']++
    } else if (exp <= 5) {
      experienceGroups['3-5 years']++
    } else if (exp <= 10) {
      experienceGroups['6-10 years']++
    } else if (exp <= 15) {
      experienceGroups['11-15 years']++
    } else {
      experienceGroups['16+ years']++
    }
  })

  // Average scores
  const validAssessments = assessments.filter(a =>
    a.vision_score !== null && a.people_score !== null && a.execution_score !== null
  )

  const avgVision = validAssessments.length > 0
    ? validAssessments.reduce((sum, a) => sum + (a.vision_score || 0), 0) / validAssessments.length
    : 0

  const avgPeople = validAssessments.length > 0
    ? validAssessments.reduce((sum, a) => sum + (a.people_score || 0), 0) / validAssessments.length
    : 0

  const avgExecution = validAssessments.length > 0
    ? validAssessments.reduce((sum, a) => sum + (a.execution_score || 0), 0) / validAssessments.length
    : 0

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentTests = assessments.filter(a => new Date(a.created_at) > thirtyDaysAgo).length

  const report = `
POWER3 Leadership Assessment Analytics Report
===========================================
Generated: ${new Date().toLocaleString()}

OVERVIEW
--------
Total Assessments: ${totalTests}
Recent Tests (30 days): ${recentTests}
Valid Score Data: ${validAssessments.length}

PERSONALITY TYPE DISTRIBUTION
----------------------------
${Object.entries(profileDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => `${type}: ${count} (${((count / totalTests) * 100).toFixed(1)}%)`)
      .join('\n')}

AGE DISTRIBUTION
---------------
${Object.entries(ageGroups)
      .map(([group, count]) => `${group}: ${count} (${((count / totalTests) * 100).toFixed(1)}%)`)
      .join('\n')}

GENDER DISTRIBUTION
------------------
${Object.entries(genderDistribution)
      .map(([gender, count]) => `${gender}: ${count} (${((count / totalTests) * 100).toFixed(1)}%)`)
      .join('\n')}

LEADERSHIP EXPERIENCE DISTRIBUTION
---------------------------------
${Object.entries(experienceGroups)
      .map(([group, count]) => `${group}: ${count} (${((count / totalTests) * 100).toFixed(1)}%)`)
      .join('\n')}

AVERAGE SCORES
-------------
Vision: ${avgVision.toFixed(2)}
People: ${avgPeople.toFixed(2)}
Execution: ${avgExecution.toFixed(2)}

---
Generated by POWER3 Leadership Assessment System
`.trim()

  return report
}

export function generateSummaryReport(assessments: (Assessment & { user: User })[], profiles: Profile[]): string {
  const totalTests = assessments.length

  if (totalTests === 0) {
    return 'No assessment data available for summary report.'
  }

  // Calculate completion rate (assessments with personality type)
  const completedAssessments = assessments.filter(a => a.personality_type)
  const completionRate = (completedAssessments.length / totalTests * 100).toFixed(1)

  // Most common personality types
  const typeDistribution: Record<string, number> = {}
  completedAssessments.forEach(assessment => {
    if (assessment.personality_type) {
      typeDistribution[assessment.personality_type] = (typeDistribution[assessment.personality_type] || 0) + 1
    }
  })

  const topTypes = Object.entries(typeDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Average scores for completed assessments
  const validScores = completedAssessments.filter(a =>
    a.vision_score !== null && a.people_score !== null && a.execution_score !== null
  )

  const avgScores = validScores.length > 0 ? {
    vision: validScores.reduce((sum, a) => sum + (a.vision_score || 0), 0) / validScores.length,
    people: validScores.reduce((sum, a) => sum + (a.people_score || 0), 0) / validScores.length,
    execution: validScores.reduce((sum, a) => sum + (a.execution_score || 0), 0) / validScores.length
  } : { vision: 0, people: 0, execution: 0 }

  // Recent activity
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const recentTests = assessments.filter(a => new Date(a.created_at) > lastWeek).length

  const report = `
POWER3 Leadership Assessment Summary Report
=========================================
Generated: ${new Date().toLocaleString()}

OVERVIEW
--------
Total Assessments: ${totalTests}
Completed Assessments: ${completedAssessments.length}
Completion Rate: ${completionRate}%
Recent Activity (7 days): ${recentTests}

TOP PERSONALITY TYPES
--------------------
${topTypes.map(([type, count], index) => {
    const profile = profiles.find(p => p.code === type)
    const percentage = completedAssessments.length > 0 ? ((count / completedAssessments.length) * 100).toFixed(1) : '0.0'
    return `${index + 1}. ${type} - ${profile?.title || 'Unknown'} (${count} tests, ${percentage}%)`
  }).join('\n')}

AVERAGE DOMAIN SCORES
--------------------
Vision: ${avgScores.vision.toFixed(2)}
People: ${avgScores.people.toFixed(2)}
Execution: ${avgScores.execution.toFixed(2)}

INSIGHTS
--------
• Most dominant domain: ${avgScores.vision >= avgScores.people && avgScores.vision >= avgScores.execution ? 'Vision' :
      avgScores.people >= avgScores.execution ? 'People' : 'Execution'}
• Assessment completion rate: ${completionRate}%
• Recent engagement: ${recentTests} tests in the last week

---
Generated by POWER3 Leadership Assessment System
`.trim()

  return report
}