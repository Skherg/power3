-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INT,
    gender TEXT,
    leadership_experience INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the assessments table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    vision_score REAL,
    people_score REAL,
    execution_score REAL,
    extraversion_score REAL,
    introversion_score REAL,
    personality_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the test_links table
CREATE TABLE test_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Create the settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value BOOLEAN
);

-- Create the profiles table
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

-- Create the questions table
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    domain TEXT,
    component TEXT,
    text TEXT,
    tag TEXT
);