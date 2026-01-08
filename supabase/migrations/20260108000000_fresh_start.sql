-- Fresh Start SQL for Power3 Assessment App
-- This script drops all existing tables and recreates them with proper RLS policies

-- ============================================
-- STEP 1: Drop all existing policies and tables
-- ============================================

-- Drop policies first (in case they exist)
DROP POLICY IF EXISTS "access_requests_insert_public" ON access_requests;
DROP POLICY IF EXISTS "access_requests_select_authenticated" ON access_requests;
DROP POLICY IF EXISTS "access_requests_update_authenticated" ON access_requests;
DROP POLICY IF EXISTS "assessments_insert_public" ON assessments;
DROP POLICY IF EXISTS "assessments_select_public" ON assessments;
DROP POLICY IF EXISTS "assessments_delete_authenticated" ON assessments;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "questions_select_public" ON questions;
DROP POLICY IF EXISTS "questions_insert_authenticated" ON questions;
DROP POLICY IF EXISTS "questions_update_authenticated" ON questions;
DROP POLICY IF EXISTS "questions_delete_authenticated" ON questions;
DROP POLICY IF EXISTS "settings_select_public" ON settings;
DROP POLICY IF EXISTS "settings_insert_authenticated" ON settings;
DROP POLICY IF EXISTS "settings_update_authenticated" ON settings;
DROP POLICY IF EXISTS "test_links_select_public" ON test_links;
DROP POLICY IF EXISTS "test_links_insert_authenticated" ON test_links;
DROP POLICY IF EXISTS "test_links_update_public" ON test_links;
DROP POLICY IF EXISTS "test_links_delete_authenticated" ON test_links;
DROP POLICY IF EXISTS "users_insert_public" ON users;
DROP POLICY IF EXISTS "users_select_public" ON users;
DROP POLICY IF EXISTS "users_delete_authenticated" ON users;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS test_links CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- ============================================
-- STEP 2: Create tables
-- ============================================

-- Users table (test takers, not auth users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    leadership_experience INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (personality profile definitions)
CREATE TABLE profiles (
    code TEXT PRIMARY KEY,
    title TEXT,
    style_name TEXT,
    dominant_orientation TEXT,
    supporting_orientation TEXT,
    blind_spot TEXT,
    description TEXT,
    strengths TEXT[],
    development_areas TEXT[],
    pitfalls TEXT[]
);

-- Questions table
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    domain TEXT,
    component TEXT,
    text TEXT,
    tag TEXT
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value BOOLEAN
);

-- Test links table
CREATE TABLE test_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ,
    show_results_immediately BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    single_use BOOLEAN DEFAULT false
);

-- Assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    answers JSONB NOT NULL,
    vision_score REAL,
    people_score REAL,
    execution_score REAL,
    extraversion_score REAL,
    introversion_score REAL,
    personality_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    vision_self REAL,
    people_self REAL,
    execution_self REAL
);

-- Access requests table
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organization TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    generated_link_id UUID REFERENCES test_links(id) ON DELETE SET NULL
);

-- ============================================
-- STEP 3: Enable RLS on all tables
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create RLS policies
-- ============================================

-- USERS policies
-- Public can insert (create test takers)
CREATE POLICY "users_insert_public" ON users
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Public can select (view test taker info)
CREATE POLICY "users_select_public" ON users
    FOR SELECT TO anon, authenticated
    USING (true);

-- Authenticated can delete (admin cleanup)
CREATE POLICY "users_delete_authenticated" ON users
    FOR DELETE TO authenticated
    USING (true);

-- PROFILES policies
-- Public can select (view personality profiles)
CREATE POLICY "profiles_select_public" ON profiles
    FOR SELECT TO anon, authenticated
    USING (true);

-- Authenticated can manage profiles (admin)
CREATE POLICY "profiles_insert_authenticated" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "profiles_update_authenticated" ON profiles
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "profiles_delete_authenticated" ON profiles
    FOR DELETE TO authenticated
    USING (true);

-- QUESTIONS policies
-- Public can select (view questions for assessment)
CREATE POLICY "questions_select_public" ON questions
    FOR SELECT TO anon, authenticated
    USING (true);

-- Authenticated can manage questions (admin)
CREATE POLICY "questions_insert_authenticated" ON questions
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "questions_update_authenticated" ON questions
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "questions_delete_authenticated" ON questions
    FOR DELETE TO authenticated
    USING (true);

-- SETTINGS policies
-- Public can select (read settings)
CREATE POLICY "settings_select_public" ON settings
    FOR SELECT TO anon, authenticated
    USING (true);

-- Authenticated can manage settings (admin)
CREATE POLICY "settings_insert_authenticated" ON settings
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "settings_update_authenticated" ON settings
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- TEST_LINKS policies
-- Public can select (validate links)
CREATE POLICY "test_links_select_public" ON test_links
    FOR SELECT TO anon, authenticated
    USING (true);

-- Public can update (mark as used)
CREATE POLICY "test_links_update_public" ON test_links
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated can insert (admin creates links)
CREATE POLICY "test_links_insert_authenticated" ON test_links
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Authenticated can delete (admin revokes links)
CREATE POLICY "test_links_delete_authenticated" ON test_links
    FOR DELETE TO authenticated
    USING (true);

-- ASSESSMENTS policies
-- Public can select (view results)
CREATE POLICY "assessments_select_public" ON assessments
    FOR SELECT TO anon, authenticated
    USING (true);

-- Public can insert (submit assessment)
CREATE POLICY "assessments_insert_public" ON assessments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Authenticated can update (admin recalculate)
CREATE POLICY "assessments_update_authenticated" ON assessments
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated can delete (admin cleanup)
CREATE POLICY "assessments_delete_authenticated" ON assessments
    FOR DELETE TO authenticated
    USING (true);

-- ACCESS_REQUESTS policies
-- Public can insert (submit access request)
CREATE POLICY "access_requests_insert_public" ON access_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Authenticated can select (admin view requests)
CREATE POLICY "access_requests_select_authenticated" ON access_requests
    FOR SELECT TO authenticated
    USING (true);

-- Authenticated can update (admin approve/reject)
CREATE POLICY "access_requests_update_authenticated" ON access_requests
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_personality_type ON assessments(personality_type);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_test_links_link_code ON test_links(link_code);
CREATE INDEX IF NOT EXISTS idx_test_links_is_used ON test_links(is_used);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
