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

    // Admin check removed: Authenticated user is treated as admin

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

    // Admin check removed: Authenticated user is treated as admin

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

    // Admin check removed: Authenticated user is treated as admin

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

// Assessment Functions
export async function submitAssessment(
    userId: string,
    answers: Record<string, number>,
    selfAssessment?: SelfAssessment
): Promise<Assessment | null> {
    // Calculate scores based on answers
    const scores = await calculateScores(answers)

    const assessmentData = {
        user_id: userId,
        answers,
        ...scores,
        // Add self-assessment scores if provided
        ...(selfAssessment && {
            vision_self: selfAssessment.vision,
            people_self: selfAssessment.people,
            execution_self: selfAssessment.execution
        })
    }

    const { data, error } = await supabase
        .from('assessments')
        .insert(assessmentData)
        .select()
        .single()

    if (error) {
        console.error('Error submitting assessment:', error)
        return null
    }

    return data
}

// Enhanced Assessment Functions with Self Assessment
export async function submitAssessmentWithSelfAssessment(
    user: User,
    answers: Record<string, number>,
    selfAssessment: SelfAssessment
): Promise<{ id: string } | null> {
    try {
        // Use the existing submitAssessment function with self-assessment data
        const assessment = await submitAssessment(user.id, answers, selfAssessment)
        
        if (!assessment) {
            console.error('Failed to submit assessment')
            return null
        }

        // Return the assessment ID
        return { id: assessment.id }
    } catch (error) {
        console.error('Error in submitAssessmentWithSelfAssessment:', error)
        return null
    }
}

// Settings Functions
export async function getSetting(key: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single()

    if (error) {
        console.error('Error fetching setting:', error)
        return false
    }

    return data?.value || false
}

export async function updateSetting(key: string, value: boolean): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Admin check removed: Authenticated user is treated as admin

    const { error } = await supabase
        .from('settings')
        .upsert({ key, value })

    if (error) {
        console.error('Error updating setting:', error)
        return false
    }

    return true
}

// Profile Functions
export async function getProfile(code: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('code', code)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return data
}

export async function getAllProfiles(): Promise<Profile[]> {
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

export async function getAssessmentWithProfile(assessmentId: string): Promise<{ assessment: Assessment & { user: User }, profile: Profile | null } | null> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return null
    }

    // Admin check removed: Authenticated user is treated as admin

    const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
            *,
            user:users(*)
        `)
        .eq('id', assessmentId)
        .single()

    if (assessmentError) {
        console.error('Error fetching assessment:', assessmentError)
        return null
    }

    let profile: Profile | null = null
    if (assessment.personality_type) {
        profile = await getProfile(assessment.personality_type)
    }

    return { assessment, profile }
}

// Public function to get assessment results (no admin required)
export async function getPublicAssessmentResults(assessmentId: string): Promise<{ assessment: Assessment & { user: User }, profile: Profile | null } | null> {
    const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
            *,
            user:users(*)
        `)
        .eq('id', assessmentId)
        .single()

    if (assessmentError) {
        console.error('Error fetching assessment:', assessmentError)
        return null
    }

    let profile: Profile | null = null
    if (assessment.personality_type) {
        profile = await getProfile(assessment.personality_type)
    }

    return { assessment, profile }
}

export async function getAllAssessmentsWithProfiles(): Promise<{ assessment: Assessment & { user: User }, profile: Profile | null }[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Admin check removed: Authenticated user is treated as admin

    const assessments = await getAllAssessments()
    const profiles = await getAllProfiles()

    return assessments.map(assessment => {
        const profile = assessment.personality_type
            ? profiles.find(p => p.code === assessment.personality_type) || null
            : null
        return { assessment, profile }
    })
}

export async function getAllAssessmentsWithDetailedAnswers(): Promise<(Assessment & { user: User })[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Admin check removed: Authenticated user is treated as admin

    // Get all assessments with user data and detailed answers
    const { data, error } = await supabase
        .from('assessments')
        .select(`
            *,
            user:users(*)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching detailed assessments:', error)
        return []
    }

    return data || []
}

// Note: Admin user creation should be done manually in Supabase dashboard
// This function is removed for security - service role key should not be in client code

export async function getAllAssessments(): Promise<(Assessment & { user: User })[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Admin check removed: Authenticated user is treated as admin

    const { data, error } = await supabase
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

    return data || []
}

export async function generateTestLink(
    showResultsImmediately?: boolean | null,
    expiresAt?: string | null,
    singleUse?: boolean
): Promise<string | null> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return null
    }

    // Admin check removed: Authenticated user is treated as admin

    const linkCode = generateUniqueCode()

    const insertData = {
        link_code: linkCode,
        show_results_immediately: showResultsImmediately,
        expires_at: expiresAt,
        single_use: singleUse ?? true
    }

    console.log('Inserting test link with data:', insertData)

    const { data, error } = await supabase
        .from('test_links')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.error('Error generating test link:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
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

    // Admin check removed: Authenticated user is treated as admin

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
export async function submitAccessRequest(requestData: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    organization?: string
    message?: string
}): Promise<boolean> {
    const { error } = await supabase
        .from('access_requests')
        .insert(requestData)

    if (error) {
        console.error('Error submitting access request:', error)
        return false
    }

    return true
}

export async function getAllAccessRequests(): Promise<any[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Admin check removed: Authenticated user is treated as admin

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

    // Admin check removed: Authenticated user is treated as admin

    // Generate a test link
    const linkCode = await generateTestLink(showResults, expiresAt, singleUse)
    
    if (!linkCode) {
        return { success: false }
    }

    // Get the link ID
    const { data: linkData } = await supabase
        .from('test_links')
        .select('id')
        .eq('link_code', linkCode)
        .single()

    // Update the access request
    const { error: updateError } = await supabase
        .from('access_requests')
        .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            generated_link_id: linkData?.id
        })
        .eq('id', requestId)

    if (updateError) {
        console.error('Error updating access request:', updateError)
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

    // Admin check removed: Authenticated user is treated as admin

    const { error } = await supabase
        .from('access_requests')
        .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
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

    // Admin check removed: Authenticated user is treated as admin

    // Delete the link
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

export async function generateBatchTestLinks(
    count: number,
    showResultsImmediately?: boolean | null,
    expiresAt?: string | null,
    singleUse?: boolean
): Promise<string[]> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return []
    }

    // Admin check removed: Authenticated user is treated as admin

    // Limit batch size for safety
    const batchSize = Math.min(count, 100)
    const linkCodes: string[] = []
    const linksToInsert = []

    // Generate all codes first
    for (let i = 0; i < batchSize; i++) {
        const linkCode = generateUniqueCode()
        linkCodes.push(linkCode)
        linksToInsert.push({
            link_code: linkCode,
            show_results_immediately: showResultsImmediately,
            expires_at: expiresAt,
            single_use: singleUse ?? true
        })
    }

    // Insert all links in one batch
    console.log('Inserting batch test links with data:', linksToInsert)

    const { data, error } = await supabase
        .from('test_links')
        .insert(linksToInsert)
        .select()

    if (error) {
        console.error('Error generating batch test links:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return []
    }

    return linkCodes
}

export async function recalculateAssessment(assessmentId: string): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Admin check removed: Authenticated user is treated as admin

    // Get the assessment
    const { data: assessment, error: getError } = await supabase
        .from('assessments')
        .select('answers')
        .eq('id', assessmentId)
        .single()

    if (getError || !assessment) {
        console.error('Error fetching assessment:', getError)
        return false
    }

    try {
        // Recalculate scores
        const scores = await calculateScores(assessment.answers)

        // Update the assessment with new scores
        const { error: updateError } = await supabase
            .from('assessments')
            .update(scores)
            .eq('id', assessmentId)

        if (updateError) {
            console.error('Error updating assessment:', updateError)
            return false
        }

        return true
    } catch (error) {
        console.error('Error recalculating assessment:', error)
        return false
    }
}

export async function recalculateAllAssessments(): Promise<number> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return 0
    }

    // Admin check removed: Authenticated user is treated as admin

    // Get all assessments that need recalculation (null personality_type)
    const { data: assessments, error: getError } = await supabase
        .from('assessments')
        .select('id, answers')
        .is('personality_type', null)

    if (getError) {
        console.error('Error fetching assessments:', getError)
        return 0
    }

    let recalculatedCount = 0

    for (const assessment of assessments || []) {
        try {
            const scores = await calculateScores(assessment.answers)
            
            const { error: updateError } = await supabase
                .from('assessments')
                .update(scores)
                .eq('id', assessment.id)

            if (!updateError) {
                recalculatedCount++
            }
        } catch (error) {
            console.error(`Error recalculating assessment ${assessment.id}:`, error)
        }
    }

    return recalculatedCount
}

export async function deleteAssessment(assessmentId: string): Promise<boolean> {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return false
    }

    // Admin check removed: Authenticated user is treated as admin

    // First get the assessment to get the user_id
    const { data: assessment, error: getError } = await supabase
        .from('assessments')
        .select('user_id')
        .eq('id', assessmentId)
        .single()

    if (getError) {
        console.error('Error fetching assessment for deletion:', getError)
        return false
    }

    // Delete the assessment
    const { error: deleteAssessmentError } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentId)

    if (deleteAssessmentError) {
        console.error('Error deleting assessment:', deleteAssessmentError)
        return false
    }

    // Delete the associated user
    const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', assessment.user_id)

    if (deleteUserError) {
        console.error('Error deleting user:', deleteUserError)
        // Assessment is already deleted, so we'll return true but log the error
        console.warn('Assessment deleted but user deletion failed')
    }

    return true
}

export async function getTestStats() {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('User not authenticated')
        return {
            totalTests: 0,
            profileDistribution: {},
            recentTests: 0
        }
    }

    // Admin check removed: Authenticated user is treated as admin

    const { data: assessments, error } = await supabase
        .from('assessments')
        .select('personality_type, created_at')

    if (error) {
        console.error('Error fetching test stats:', error)
        return {
            totalTests: 0,
            profileDistribution: {},
            recentTests: 0
        }
    }

    const totalTests = assessments?.length || 0
    const profileDistribution = assessments?.reduce((acc, assessment) => {
        if (assessment.personality_type) {
            acc[assessment.personality_type] = (acc[assessment.personality_type] || 0) + 1
        }
        return acc
    }, {} as Record<string, number>) || {}

    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const recentTests = assessments?.filter(
        assessment => new Date(assessment.created_at) > lastWeek
    ).length || 0

    return {
        totalTests,
        profileDistribution,
        recentTests
    }
}

// Helper Functions
function generateUniqueCode(): string {
    // Generate a more secure random code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const randomArray = new Uint8Array(16)
    crypto.getRandomValues(randomArray)

    for (let i = 0; i < randomArray.length; i++) {
        result += chars.charAt(randomArray[i] % chars.length)
    }

    return result
}

async function calculateScores(answers: Record<string, number>) {
    // Get questions from database to use in calculations
    const questions = await getQuestions()
    
    // Use the proper calculation function
    const { calculateAssessmentResults } = await import('../utils/calculations')
    const results = calculateAssessmentResults(answers, {}, questions)

    return {
        vision_score: results.categoryScores.find(c => c.category === 'Vision')?.average || 0,
        people_score: results.categoryScores.find(c => c.category === 'People')?.average || 0,
        execution_score: results.categoryScores.find(c => c.category === 'Execution')?.average || 0,
        extraversion_score: results.eiScore.extraversionAverage,
        introversion_score: results.eiScore.introversionAverage,
        personality_type: results.personalityType
    }
}