-- ============================================
-- SUPABASE DATABASE SETUP
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    hq TEXT,
    deal_sourcer TEXT,
    analyst TEXT,
    entry_date DATE,
    entry_stage TEXT,
    current_stage TEXT,
    initial_investment NUMERIC DEFAULT 0,
    total_invested NUMERIC DEFAULT 0,
    latest_valuation NUMERIC DEFAULT 0,
    ownership NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    exit_value NUMERIC,
    notes TEXT,
    documents JSONB DEFAULT '[]',
    legal_rights JSONB DEFAULT '{}',
    follow_ons JSONB DEFAULT '[]',
    founder_ids JSONB DEFAULT '[]',
    initial_valuation NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create founders table
CREATE TABLE IF NOT EXISTS founders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    linkedin TEXT,
    background TEXT,
    role TEXT,
    company_ids JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create funds table
CREATE TABLE IF NOT EXISTS funds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    manager TEXT,
    vintage_year INTEGER,
    committed_capital NUMERIC DEFAULT 0,
    strategy TEXT,
    status TEXT DEFAULT 'Active',
    capital_calls JSONB DEFAULT '[]',
    distributions JSONB DEFAULT '[]',
    nav_history JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now)
-- In production, you'd want to restrict this based on user auth
CREATE POLICY "Allow all operations on companies" ON companies
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on founders" ON founders
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on funds" ON funds
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_current_stage ON companies(current_stage);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_founders_name ON founders(name);
CREATE INDEX IF NOT EXISTS idx_funds_status ON funds(status);
