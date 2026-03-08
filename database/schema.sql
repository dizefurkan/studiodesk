-- Database Schema for Dance Studio Management SaaS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSON support
CREATE EXTENSION IF NOT EXISTS "json";

-- ========================================
-- ORGANIZATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- ========================================
-- PROFILES (from auth.users)
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- ========================================
-- ORGANIZATION_USERS (User-Organization Relationship)
-- ========================================
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'instructor', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX idx_organization_users_role ON organization_users(role);

-- ========================================
-- BRANCHES
-- ========================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_org_id ON branches(organization_id);
CREATE INDEX idx_branches_created_at ON branches(created_at);

-- ========================================
-- INSTRUCTORS
-- ========================================
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instructors_org_id ON instructors(organization_id);
CREATE INDEX idx_instructors_email ON instructors(email);
CREATE INDEX idx_instructors_created_at ON instructors(created_at);

-- ========================================
-- BRANCH_INSTRUCTORS
-- ========================================
CREATE TABLE IF NOT EXISTS branch_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, instructor_id)
);

CREATE INDEX idx_branch_instructors_branch_id ON branch_instructors(branch_id);
CREATE INDEX idx_branch_instructors_instructor_id ON branch_instructors(instructor_id);

-- ========================================
-- STUDENTS
-- ========================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_org_id ON students(organization_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_created_at ON students(created_at);

-- ========================================
-- DANCE_TYPES
-- ========================================
CREATE TABLE IF NOT EXISTS dance_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dance_types_org_id ON dance_types(organization_id);
CREATE INDEX idx_dance_types_created_at ON dance_types(created_at);

-- ========================================
-- INSTRUCTOR_RATES
-- ========================================
CREATE TABLE IF NOT EXISTS instructor_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  dance_type_id UUID NOT NULL REFERENCES dance_types(id) ON DELETE CASCADE,
  price_per_class NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, branch_id, dance_type_id)
);

CREATE INDEX idx_instructor_rates_instructor_id ON instructor_rates(instructor_id);
CREATE INDEX idx_instructor_rates_branch_id ON instructor_rates(branch_id);
CREATE INDEX idx_instructor_rates_dance_type_id ON instructor_rates(dance_type_id);

-- ========================================
-- COURSES
-- ========================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  dance_type_id UUID NOT NULL REFERENCES dance_types(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_branch_id ON courses(branch_id);
CREATE INDEX idx_courses_dance_type_id ON courses(dance_type_id);
CREATE INDEX idx_courses_day_of_week ON courses(day_of_week);
CREATE INDEX idx_courses_created_at ON courses(created_at);

-- ========================================
-- COURSE_INSTRUCTORS
-- ========================================
CREATE TABLE IF NOT EXISTS course_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, instructor_id)
);

CREATE INDEX idx_course_instructors_course_id ON course_instructors(course_id);
CREATE INDEX idx_course_instructors_instructor_id ON course_instructors(instructor_id);

-- ========================================
-- COURSE_SESSIONS (Auto-generated from courses)
-- ========================================
CREATE TABLE IF NOT EXISTS course_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_course_sessions_course_id ON course_sessions(course_id);
CREATE INDEX idx_course_sessions_session_date ON course_sessions(session_date);
CREATE INDEX idx_course_sessions_created_at ON course_sessions(created_at);

-- ========================================
-- SESSION_INSTRUCTORS
-- ========================================
CREATE TABLE IF NOT EXISTS session_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, instructor_id)
);

CREATE INDEX idx_session_instructors_session_id ON session_instructors(session_id);
CREATE INDEX idx_session_instructors_instructor_id ON session_instructors(instructor_id);

-- ========================================
-- PACKAGES
-- ========================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dance_type_id UUID NOT NULL REFERENCES dance_types(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_credits INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_packages_org_id ON packages(organization_id);
CREATE INDEX idx_packages_dance_type_id ON packages(dance_type_id);
CREATE INDEX idx_packages_created_at ON packages(created_at);

-- ========================================
-- STUDENT_PACKAGES
-- ========================================
CREATE TABLE IF NOT EXISTS student_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  remaining_credits INT NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expire_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_packages_student_id ON student_packages(student_id);
CREATE INDEX idx_student_packages_package_id ON student_packages(package_id);
CREATE INDEX idx_student_packages_expire_date ON student_packages(expire_date);
CREATE INDEX idx_student_packages_created_at ON student_packages(created_at);

-- ========================================
-- ATTENDANCES
-- ========================================
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_package_id UUID NOT NULL REFERENCES student_packages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendances_session_id ON attendances(session_id);
CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_attendances_student_package_id ON attendances(student_package_id);
CREATE INDEX idx_attendances_created_at ON attendances(created_at);

-- ========================================
-- INSTRUCTOR_EARNINGS
-- ========================================
CREATE TABLE IF NOT EXISTS instructor_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, session_id)
);

CREATE INDEX idx_instructor_earnings_instructor_id ON instructor_earnings(instructor_id);
CREATE INDEX idx_instructor_earnings_session_id ON instructor_earnings(session_id);
CREATE INDEX idx_instructor_earnings_created_at ON instructor_earnings(created_at);

-- ========================================
-- CASH_TRANSACTIONS
-- ========================================
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  student_package_id UUID REFERENCES student_packages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_transactions_branch_id ON cash_transactions(branch_id);
CREATE INDEX idx_cash_transactions_type ON cash_transactions(type);
CREATE INDEX idx_cash_transactions_student_package_id ON cash_transactions(student_package_id);
CREATE INDEX idx_cash_transactions_created_at ON cash_transactions(created_at);

-- ========================================
-- HISTORY_LOGS
-- ========================================
CREATE TABLE IF NOT EXISTS history_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  entity VARCHAR(255) NOT NULL,
  entity_id UUID NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_logs_org_id ON history_logs(organization_id);
CREATE INDEX idx_history_logs_action ON history_logs(action);
CREATE INDEX idx_history_logs_entity ON history_logs(entity);
CREATE INDEX idx_history_logs_created_at ON history_logs(created_at);

-- ========================================
-- TRIGGERS FOR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_users_updated_at BEFORE UPDATE ON organization_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_instructors_updated_at BEFORE UPDATE ON branch_instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dance_types_updated_at BEFORE UPDATE ON dance_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_rates_updated_at BEFORE UPDATE ON instructor_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_instructors_updated_at BEFORE UPDATE ON course_instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_sessions_updated_at BEFORE UPDATE ON course_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_instructors_updated_at BEFORE UPDATE ON session_instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_packages_updated_at BEFORE UPDATE ON student_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_earnings_updated_at BEFORE UPDATE ON instructor_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_transactions_updated_at BEFORE UPDATE ON cash_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
