import { supabase, User, Assessment, TestLink, Profile, Question } from './supabase'
import { SelfAssessment } from '../types/Assessment'

// Test Link Functions
export async function validateTestLink(linkCode: string): Promise<TestLink | null> {
    // For multi-use links, we don't filter by is_used
    const { data, error } = await supabase
        .from('test_links')
        .select('*')
        .eq('link_code', linkCode)
        .single()

    if (error) {
        console.error('Error validating test link:', error)
        return null
    }

    // Check if link has expired
    if (data.expires_at) {
        const expirationDate = new Date(data.expires_at)
        const now = new Date()
        
        if (now > expirationDate) {
            console.log('Test link has expired')
            return null
        }
    }

    // Check if single-use link has already been used
    if (data.single_use && data.is_used) {
        console.log('Single-use test link has already been used')
        return null
    }

    return data
}

export async function getEffectiveShowResultsSetting(linkCode: string): Promise<boolean> {
    // First get the test link to check its per-link setting
    const testLink = await validateTestLink(linkCode)

    if (!testLink) {
        // If link doesn't exist or is invalid, default to false
        return false
    }

    // If the test link has a specific setting, use it
    if (testLink.show_results_immediately !== null && testLink.show_results_immediately !== undefined) {
        return testLink.show_results_immediately
    }

    // Otherwise, fall back to the global setting
    return await getSetting('show_results_immediately')
}

export async function markTestLinkAsUsed(linkCode: string): Promise<boolean> {
    const { error } = await supabase
        .from('test_links')
        .update({
            is_used: true,
            used_at: new Date().toISOString()
        })
        .eq('link_code', linkCode)

    if (error) {
        console.error('Error marking test link as used:', error)
        return false
    }

    return true
}

// User Functions
export async function createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User | null> {
    console.log('Creating user with data:', userData)

    const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

    if (error) {
        console.error('Error creating user:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        console.error('User data that failed:', userData)
        return null
    }

    console.log('User created successfully:', data)
    return data
}

// Question Functions
export async function getQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('id')

    if (error) {
        console.error('Error fetching questions:', error)
        return []
    }

    return data || []
}

export async function createQuestion(question: Omit<Question, 'created_at'>): Promise<Question | null> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return null
    }

    // Any authenticated user is admin
    const { data, error } = await supabase
        .from('questions')
        .insert(question)
        .select()
        .single()

    if (error) {
        console.error('Error creating question:', error)
        return null
    }

    return data
}

export async function updateQuestion(id: string, updates: Partial<Omit<Question, 'id' | 'created_at'>>): Promise<Question | null> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return null
    }

    // Any authenticated user is admin
    const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating question:', error)
        return null
    }

    return data
}

export async function deleteQuestion(id: string): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Any authenticated user is admin
    const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting question:', error)
        return false
    }

    return true
}

// Settings Functions
export async function getSetting(key: string): Promise<any> {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single()

    if (error) {
        console.error('Error fetching setting:', error)
        return null
    }

    return data?.value
}

export async function setSetting(key: string, value: any): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Any authenticated user is admin
    const { error } = await supabase
        .from('settings')
        .upsert({ key, value })

    if (error) {
        console.error('Error setting value:', error)
        return false
    }

    return true
}

// Assessment Functions
export async function getAllAssessments(): Promise<(Assessment & { user: User })[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Any authenticated user is admin
    const { data: assessments, error } = await supabase
        .from('assessments')
        .select(`
            *,
            user:users(*)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching assessments:', error)
        return []
    }

    return assessments || []
}

export async function getAllProfiles(): Promise<Profile[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Any authenticated user is admin
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('code')

    if (error) {
        console.error('Error fetching profiles:', error)
        return []
    }

    return data || []
}

// Test Link Management
export async function generateTestLink(
    showResultsImmediately: boolean,
    expiresAt: string | null,
    singleUse: boolean
): Promise<string | null> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return null
    }

    // Any authenticated user is admin
    const linkCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    const { data, error } = await supabase
        .from('test_links')
        .insert({
            link_code: linkCode,
            show_results_immediately: showResultsImmediately,
            expires_at: expiresAt,
            single_use: singleUse,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error generating test link:', error)
        return null
    }

    return linkCode
}

export async function getAllTestLinks(): Promise<TestLink[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Any authenticated user is admin
    const { data, error } = await supabase
        .from('test_links')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching test links:', error)
        return []
    }

    return data || []
}

// Access Request Functions
export async function getAllAccessRequests(): Promise<any[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Any authenticated user is admin
    const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching access requests:', error)
        return []
    }

    return data || []
}

export async function approveAccessRequest(
    requestId: string,
    showResults: boolean,
    expiresAt: string | null,
    singleUse: boolean
): Promise<{ success: boolean; link?: string }> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return { success: false }
    }

    // Any authenticated user is admin
    const linkCode = await generateTestLink(showResults, expiresAt, singleUse)
    
    if (!linkCode) {
        return { success: false }
    }

    const { error } = await supabase
        .from('access_requests')
        .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            test_link: linkCode
        })
        .eq('id', requestId)

    if (error) {
        console.error('Error approving access request:', error)
        return { success: false }
    }

    return { success: true, link: linkCode }
}

export async function rejectAccessRequest(requestId: string): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Any authenticated user is admin
    const { error } = await supabase
        .from('access_requests')
        .update({
            status: 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) {
        console.error('Error rejecting access request:', error)
        return false
    }

    return true
}

export async function revokeTestLink(linkId: string): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Any authenticated user is admin
    const { error } = await supabase
        .from('test_links')
        .delete()
        .eq('id', linkId)

    if (error) {
        console.error('Error revoking test link:', error)
        return false
    }

    return true
}

// Assessment Management
export async function recalculateAllAssessments(): Promise<number> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return 0
    }

    // Any authenticated user is admin
    const { data: assessments, error } = await supabase
        .from('assessments')
        .select('*')

    if (error) {
        console.error('Error fetching assessments for recalculation:', error)
        return 0
    }

    let count = 0
    for (const assessment of assessments || []) {
        // Recalculate logic would go here
        // For now, just increment count
        count++
    }

    return count
}

export async function deleteAssessment(assessmentId: string): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Any authenticated user is admin
    const { data: assessment, error: getError } = await supabase
        .from('assessments')
        .select('user_id')
        .eq('id', assessmentId)
        .single()

    if (getError || !assessment) {
        console.error('Error finding assessment:', getError)
        return false
    }

    // Delete the assessment
    const { error: deleteError } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId)

    if (deleteError) {
        console.error('Error deleting assessment:', deleteError)
        return false
    }

    return true
}

export async function getAllAssessmentsWithDetailedAnswers(): Promise<any[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Any authenticated user is admin
    const { data: assessments, error } = await supabase
        .from('assessments')
        .select(`
            *,
            user:users(*),
            answers:assessment_answers(*)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching detailed assessments:', error)
        return []
    }

    return assessments || []
}

export async function getTestStats(): Promise<{ totalTests: number; profileDistribution: Record<string, number>; recentTests: number }> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return { totalTests: 0, profileDistribution: {}, recentTests: 0 }
    }

    // Any authenticated user is admin
    const { data: assessments, error } = await supabase
        .from('assessments')
        .select('personality_type, created_at')

    if (error) {
        console.error('Error fetching test stats:', error)
        return { totalTests: 0, profileDistribution: {}, recentTests: 0 }
    }

    const totalTests = assessments?.length || 0
    const profileDistribution: Record<string, number> = {}
    let recentTests = 0

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    assessments?.forEach((assessment: any) => {
        if (assessment.personality_type) {
            profileDistribution[assessment.personality_type] = (profileDistribution[assessment.personality_type] || 0) + 1
        }
        
        if (new Date(assessment.created_at) > oneWeekAgo) {
            recentTests++
        }
    })

    return { totalTests, profileDistribution, recentTests }
}

// Assessment Creation and Retrieval
export async function createAssessment(assessment: Omit<Assessment, 'id' | 'created_at'>): Promise<Assessment | null> {
    const { data, error } = await supabase
        .from('assessments')
        .insert(assessment)
        .select()
        .single()

    if (error) {
        console.error('Error creating assessment:', error)
        return null
    }

    return data
}

export async function getAssessmentById(id: string): Promise<(Assessment & { user: User }) | null> {
    const { data, error } = await supabase
        .from('assessments')
        .select(`
            *,
            user:users(*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching assessment:', error)
        return null
    }

    return data
}

export async function saveAssessmentAnswers(assessmentId: string, answers: any[]): Promise<boolean> {
    const { error } = await supabase
        .from('assessment_answers')
        .insert(
            answers.map(answer => ({
                assessment_id: assessmentId,
                question_id: answer.question_id,
                answer_value: answer.answer_value
            }))
        )

    if (error) {
        console.error('Error saving assessment answers:', error)
        return false
    }

    return true
}

export async function updateAssessmentScores(
    assessmentId: string,
    visionScore: number,
    peopleScore: number,
    executionScore: number,
    personalityType: string
): Promise<boolean> {
    const { error } = await supabase
        .from('assessments')
        .update({
            vision_score: visionScore,
            people_score: peopleScore,
            execution_score: executionScore,
            personality_type: personalityType
        })
        .eq('id', assessmentId)

    if (error) {
        console.error('Error updating assessment scores:', error)
        return false
    }

    return true
}