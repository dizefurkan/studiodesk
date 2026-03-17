-- Row-Level Security (RLS) Policies
-- These policies ensure multi-tenant data isolation

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- HELPER FUNCTION: Get user's organization
-- ========================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ========================================
-- PROFILES POLICIES
-- ========================================
-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ========================================
-- ORGANIZATION_USERS POLICIES
-- ========================================
-- Users can read their own organization_users record
CREATE POLICY "Users can read their organization memberships"
ON organization_users FOR SELECT
USING (
  user_id = auth.uid()
);

-- Only organization owners can create/update/delete users
-- Note: These are mostly for documentation - the app uses admin client for writes
CREATE POLICY "Allow authenticated users to insert organization users"
ON organization_users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own record"
ON organization_users FOR UPDATE
USING (
  user_id = auth.uid()
);

-- ========================================
-- ORGANIZATIONS POLICIES
-- ========================================
-- Users can read their organization
CREATE POLICY "Users can read their organizations"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Only owners can update organization
CREATE POLICY "Organization owners can update"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id FROM organization_users
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- ========================================
-- BRANCHES POLICIES
-- ========================================
-- Users can read branches from their organization
CREATE POLICY "Users can read branches from their organization"
ON branches FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Managers/Owners can create branches
CREATE POLICY "Managers can create branches"
ON branches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = branches.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- Managers/Owners can update branches
CREATE POLICY "Managers can update branches"
ON branches FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = branches.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- ========================================
-- INSTRUCTORS POLICIES
-- ========================================
-- Users can read instructors from their organization
CREATE POLICY "Users can read instructors"
ON instructors FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Managers/Owners can create instructors
CREATE POLICY "Managers can create instructors"
ON instructors FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = instructors.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- Managers/Owners can update instructors
CREATE POLICY "Managers can update instructors"
ON instructors FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = instructors.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- ========================================
-- BRANCH_INSTRUCTORS POLICIES
-- ========================================
CREATE POLICY "Users can read branch_instructors"
ON branch_instructors FOR SELECT
USING (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Managers can manage branch_instructors"
ON branch_instructors FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  )
);

-- ========================================
-- STUDENTS POLICIES
-- ========================================
CREATE POLICY "Users can read students"
ON students FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Staff can create students"
ON students FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = students.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager', 'instructor', 'staff')
  )
);

CREATE POLICY "Staff can update students"
ON students FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = students.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager', 'instructor', 'staff')
  )
);

-- ========================================
-- DANCE_TYPES POLICIES
-- ========================================
CREATE POLICY "Users can read dance_types"
ON dance_types FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Managers can create dance_types"
ON dance_types FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = dance_types.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- ========================================
-- COURSES POLICIES
-- ========================================
CREATE POLICY "Users can read courses"
ON courses FOR SELECT
USING (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Managers can create courses"
ON courses FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  )
);

CREATE POLICY "Managers can update courses"
ON courses FOR UPDATE
USING (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  )
)
WITH CHECK (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  )
);

-- ========================================
-- COURSE_SESSIONS POLICIES
-- ========================================
CREATE POLICY "Users can read course_sessions"
ON course_sessions FOR SELECT
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Managers can insert course_sessions"
ON course_sessions FOR INSERT
WITH CHECK (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
);

CREATE POLICY "Managers can update course_sessions"
ON course_sessions FOR UPDATE
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
)
WITH CHECK (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
);

CREATE POLICY "Managers can delete course_sessions"
ON course_sessions FOR DELETE
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
);

-- ========================================
-- PACKAGES POLICIES
-- ========================================
CREATE POLICY "Users can read packages"
ON packages FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Managers can create packages"
ON packages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_id = packages.organization_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'manager')
  )
);

-- ========================================
-- STUDENT_PACKAGES POLICIES
-- ========================================
CREATE POLICY "Users can read student_packages"
ON student_packages FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Staff can create student_packages"
ON student_packages FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager', 'instructor', 'staff')
    )
  )
);

CREATE POLICY "Staff can update student_packages"
ON student_packages FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM students
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM students
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager', 'instructor', 'staff')
    )
  )
);

CREATE POLICY "Staff can delete student_packages"
ON student_packages FOR DELETE
USING (
  student_id IN (
    SELECT id FROM students
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager', 'instructor', 'staff')
    )
  )
);

-- ========================================
-- ATTENDANCES POLICIES
-- ========================================
CREATE POLICY "Users can read attendances"
ON attendances FOR SELECT
USING (
  session_id IN (
    SELECT id FROM course_sessions
    WHERE course_id IN (
      SELECT id FROM courses
      WHERE branch_id IN (
        SELECT id FROM branches
        WHERE organization_id IN (
          SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Instructors can create attendances"
ON attendances FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM course_sessions
    WHERE course_id IN (
      SELECT id FROM courses
      WHERE branch_id IN (
        SELECT id FROM branches
        WHERE organization_id IN (
          SELECT organization_id FROM organization_users
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'manager', 'instructor')
        )
      )
    )
  )
);

-- ========================================
-- INSTRUCTOR_EARNINGS POLICIES
-- ========================================
CREATE POLICY "Users can read instructor_earnings"
ON instructor_earnings FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM instructors
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create instructor_earnings"
ON instructor_earnings FOR INSERT
WITH CHECK (
  instructor_id IN (
    SELECT id FROM instructors
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
  AND
  session_id IN (
    SELECT id FROM course_sessions
    WHERE course_id IN (
      SELECT id FROM courses
      WHERE branch_id IN (
        SELECT id FROM branches
        WHERE organization_id IN (
          SELECT organization_id FROM organization_users
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'manager', 'instructor')
        )
      )
    )
  )
);

CREATE POLICY "Users can update instructor_earnings"
ON instructor_earnings FOR UPDATE
USING (
  session_id IN (
    SELECT id FROM course_sessions
    WHERE course_id IN (
      SELECT id FROM courses
      WHERE branch_id IN (
        SELECT id FROM branches
        WHERE organization_id IN (
          SELECT organization_id FROM organization_users
          WHERE user_id = auth.uid()
        )
      )
    )
  )
)
WITH CHECK (
  session_id IN (
    SELECT id FROM course_sessions
    WHERE course_id IN (
      SELECT id FROM courses
      WHERE branch_id IN (
        SELECT id FROM branches
        WHERE organization_id IN (
          SELECT organization_id FROM organization_users
          WHERE user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Users can delete instructor_earnings"
ON instructor_earnings FOR DELETE
USING (
  session_id IN (
    SELECT id FROM course_sessions
    WHERE course_id IN (
      SELECT id FROM courses
      WHERE branch_id IN (
        SELECT id FROM branches
        WHERE organization_id IN (
          SELECT organization_id FROM organization_users
          WHERE user_id = auth.uid()
        )
      )
    )
  )
);

-- ========================================
-- CASH_TRANSACTIONS POLICIES
-- ========================================
CREATE POLICY "Users can read cash_transactions"
ON cash_transactions FOR SELECT
USING (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Managers can create cash_transactions"
ON cash_transactions FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT id FROM branches
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  )
);

-- ========================================
-- HISTORY_LOGS POLICIES
-- ========================================
CREATE POLICY "Users can read history_logs"
ON history_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- ========================================
-- INSTRUCTOR_RATES POLICIES
-- ========================================
CREATE POLICY "Users can read instructor_rates"
ON instructor_rates FOR SELECT
USING (
  instructor_id IN (
    SELECT id FROM instructors
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Managers can create instructor_rates"
ON instructor_rates FOR INSERT
WITH CHECK (
  instructor_id IN (
    SELECT id FROM instructors
    WHERE organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  )
);

-- ========================================
-- COURSE_INSTRUCTORS POLICIES
-- ========================================
CREATE POLICY "Users can read course_instructors"
ON course_instructors FOR SELECT
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Managers can insert course_instructors"
ON course_instructors FOR INSERT
WITH CHECK (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
);

CREATE POLICY "Managers can delete course_instructors"
ON course_instructors FOR DELETE
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
);

-- ========================================
-- COURSE_STUDENTS POLICIES
-- ========================================
CREATE POLICY "Users can read course_students"
ON course_students FOR SELECT
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Managers can insert course_students"
ON course_students FOR INSERT
WITH CHECK (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
);

CREATE POLICY "Managers can delete course_students"
ON course_students FOR DELETE
USING (
  course_id IN (
    SELECT id FROM courses
    WHERE branch_id IN (
      SELECT id FROM branches
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
      )
    )
  )
);

-- ========================================
-- SESSION_INSTRUCTORS POLICIES
-- ========================================
CREATE POLICY "Users can read session_instructors"
ON session_instructors FOR SELECT
USING (
  session_id IN (
    SELECT id FROM course_sessions
    WHERE course_id IN (
      SELECT id FROM courses
      WHERE branch_id IN (
        SELECT id FROM branches
        WHERE organization_id IN (
          SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
      )
    )
  )
);
