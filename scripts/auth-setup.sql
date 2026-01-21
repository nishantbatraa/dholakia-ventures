-- ============================================
-- USER PROFILES TABLE FOR ROLE MANAGEMENT
-- Run this in Supabase SQL Editor
-- ============================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'Viewer' CHECK (role IN ('Admin', 'Partner', 'Analyst', 'Viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Allow read all profiles" ON user_profiles
    FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert for authenticated users (for new signups)
CREATE POLICY "Allow insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- UPDATE EXISTING TABLES FOR USER_ID
-- ============================================

-- Add user_id column to companies table (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'companies' AND column_name = 'user_id') THEN
        ALTER TABLE companies ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id column to founders table (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'founders' AND column_name = 'user_id') THEN
        ALTER TABLE founders ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id column to funds table (if not exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'funds' AND column_name = 'user_id') THEN
        ALTER TABLE funds ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'Viewer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- OPTIONAL: Set first user as Admin
-- Run this after your first signup to make yourself admin
-- ============================================

-- UPDATE user_profiles SET role = 'Admin' WHERE email = 'your-email@example.com';
