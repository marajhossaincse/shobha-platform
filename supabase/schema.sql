-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('md', 'secretary', 'director');
CREATE TYPE company_status AS ENUM ('draft', 'live', 'suspended');
CREATE TYPE director_status AS ENUM ('current', 'former');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE document_type AS ENUM ('moa', 'aoa', 'form_xii', 'schedule_x', 'other');
CREATE TYPE extraction_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE field_status AS ENUM ('matched', 'conflict', 'needs_confirmation');

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE NOT NULL,
    registered_address TEXT NOT NULL,
    company_type TEXT NOT NULL,
    incorporation_date DATE NOT NULL,
    authorised_capital BIGINT,
    paid_up_capital BIGINT,
    face_value_per_share INTEGER,
    main_objects TEXT,
    financial_year TEXT,
    logo_url TEXT,
    status company_status DEFAULT 'draft',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_status account_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DIRECTOR PROFILES TABLE
-- ============================================================================
CREATE TABLE director_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    designation TEXT NOT NULL CHECK (designation IN ('md', 'chairman', 'director')),
    nid_number_encrypted TEXT,
    passport_number_encrypted TEXT,
    share_count INTEGER DEFAULT 0,
    share_percentage DECIMAL(5,2) DEFAULT 0,
    appointment_date DATE NOT NULL,
    resignation_date DATE,
    status director_status DEFAULT 'current',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    extraction_status extraction_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EXTRACTED FIELDS TABLE
-- ============================================================================
CREATE TABLE extracted_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_value TEXT,
    confidence_score DECIMAL(5,4),
    source_page INTEGER,
    status field_status DEFAULT 'matched',
    confirmed_value TEXT,
    confirmed_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FIELD CONFLICTS TABLE
-- ============================================================================
CREATE TABLE field_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    source_1_doc_id UUID REFERENCES documents(id),
    source_1_value TEXT,
    source_2_doc_id UUID REFERENCES documents(id),
    source_2_value TEXT,
    resolved_value TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DIRECTOR VISIBILITY SETTINGS TABLE
-- ============================================================================
CREATE TABLE director_visibility_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    director_id UUID REFERENCES users(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, director_id, field_name)
);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role user_role NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_director_profiles_company_id ON director_profiles(company_id);
CREATE INDEX idx_director_profiles_user_id ON director_profiles(user_id);
CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_extracted_fields_document_id ON extracted_fields(document_id);
CREATE INDEX idx_field_conflicts_company_id ON field_conflicts(company_id);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_visibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Companies: Users can only see their own company
CREATE POLICY "Users can view their own company"
    ON companies FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Companies: MD can update their company
CREATE POLICY "MD can update their company"
    ON companies FOR UPDATE
    USING (
        id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid() AND role = 'md'
        )
    );

-- Users: Users can view users in their company
CREATE POLICY "Users can view company members"
    ON users FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Director profiles: Users can view directors in their company
CREATE POLICY "Users can view directors in their company"
    ON director_profiles FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Director profiles: Secretary can manage directors
CREATE POLICY "Secretary can manage directors"
    ON director_profiles FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid() AND role = 'secretary'
        )
    );

-- Documents: Users can view documents in their company
CREATE POLICY "Users can view company documents"
    ON documents FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Documents: Secretary can upload documents
CREATE POLICY "Secretary can upload documents"
    ON documents FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid() AND role = 'secretary'
        )
    );

-- Audit logs: Secretary can view audit logs
CREATE POLICY "Secretary can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users
            WHERE id = auth.uid() AND role = 'secretary'
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_director_profiles_updated_at BEFORE UPDATE ON director_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_director_profiles AFTER INSERT OR UPDATE OR DELETE ON director_profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_field_conflicts AFTER UPDATE ON field_conflicts
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- ============================================================================
-- SIGNUP POLICIES
-- ============================================================================

-- Allow users to insert their own profile during signup
CREATE POLICY users_can_insert_own_profile
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow MD to create company during signup
CREATE POLICY md_can_create_company
ON companies FOR INSERT
WITH CHECK (auth.uid() = created_by);
