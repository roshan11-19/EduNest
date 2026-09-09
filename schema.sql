-- ============================================================================
-- EDUNEST HOME TUITION PLATFORM - DATABASE SCHEMA & POLICIES
-- Execute this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Enable UUID Extensions (gen_random_uuid is native in Postgres 13+)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create student_registrations Table
CREATE TABLE IF NOT EXISTS public.student_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg_code VARCHAR(32) NOT NULL UNIQUE,
    student_name VARCHAR(150) NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    class VARCHAR(50) NOT NULL,
    board VARCHAR(50) NOT NULL,
    board_other VARCHAR(100),
    subjects TEXT[] NOT NULL,
    subject_count INT NOT NULL DEFAULT 1,
    monthly_fee NUMERIC(10, 2) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    student_phone VARCHAR(20),
    email VARCHAR(150),
    location TEXT NOT NULL,
    preferred_days TEXT[] NOT NULL,
    preferred_time_period VARCHAR(50),
    preferred_time_slot VARCHAR(100) NOT NULL,
    additional_message TEXT,
    registration_status VARCHAR(50) NOT NULL DEFAULT 'New',
    teacher_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.student_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_registrations_class ON public.student_registrations(class);
CREATE INDEX IF NOT EXISTS idx_registrations_board ON public.student_registrations(board);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.student_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_reg_code ON public.student_registrations(reg_code);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON public.student_registrations(phone);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies (Allow Public Registration & Admin Management)

-- Policy A: Allow Public / Students to INSERT registrations
DROP POLICY IF EXISTS "Allow public student registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Allow public insert registrations" ON public.student_registrations;
CREATE POLICY "Allow public insert registrations"
ON public.student_registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Policy B: Allow Public to READ registrations
DROP POLICY IF EXISTS "Allow authenticated teachers to read registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Allow public read registrations" ON public.student_registrations;
CREATE POLICY "Allow public read registrations"
ON public.student_registrations
FOR SELECT
TO public
USING (true);

-- Policy C: Allow Public to UPDATE registrations (Status, Notes)
DROP POLICY IF EXISTS "Allow authenticated teachers to update registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Allow public update registrations" ON public.student_registrations;
CREATE POLICY "Allow public update registrations"
ON public.student_registrations
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy D: Allow Public to DELETE registrations
DROP POLICY IF EXISTS "Allow authenticated teachers to delete registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Allow public delete registrations" ON public.student_registrations;
CREATE POLICY "Allow public delete registrations"
ON public.student_registrations
FOR DELETE
TO public
USING (true);

-- 6. Grant Permissions to Postgres Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.student_registrations TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 7. Trigger for Automatic updated_at Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_student_registrations_updated_at ON public.student_registrations;
CREATE TRIGGER set_student_registrations_updated_at
BEFORE UPDATE ON public.student_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable Realtime Replication (Optional - provides live dashboard updates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'student_registrations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.student_registrations;
    END IF;
END $$;
