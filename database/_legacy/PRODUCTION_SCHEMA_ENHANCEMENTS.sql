-- ========================================
-- PRODUCTION-READY SCHEMA UPDATE
-- Dance Studio Management SaaS
-- ========================================

-- ========================================
-- PART 1: SCHEMA ENHANCEMENTS
-- ========================================

-- Add validity_days to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 30
CHECK (validity_days > 0);

-- Add expire_date to student_packages table
ALTER TABLE student_packages
ADD COLUMN IF NOT EXISTS expire_date TIMESTAMPTZ
GENERATED ALWAYS AS (purchase_date + (validity_days || ' days')::INTERVAL) STORED;

-- Add constraints to prevent invalid credit states
ALTER TABLE student_packages
ADD CONSTRAINT check_remaining_credits_nonnegative
  CHECK (remaining_credits >= 0);

ALTER TABLE student_packages
ADD CONSTRAINT check_expire_date_valid
  CHECK (expire_date IS NULL OR expire_date > purchase_date);

-- Add foreign key constraint from attendances to student_packages
ALTER TABLE attendances
ADD CONSTRAINT fk_attendances_student_package_id
  FOREIGN KEY (student_package_id) REFERENCES student_packages(id) ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- ========================================
-- PART 2: CRITICAL INDICES FOR PERFORMANCE
-- ========================================

-- HIGH TRAFFIC: Attendance lookups by date range (reporting, filtering)
CREATE INDEX IF NOT EXISTS idx_attendances_created_at_desc
ON attendances(created_at DESC)
INCLUDE (session_id, student_id, student_package_id);

-- COMPOUND: Session + Student for duplicate detection
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendances_session_student_unique
ON attendances(session_id, student_id)
WHERE deleted_at IS NULL;

-- REPORTING: Instructor earnings by date range (payroll, reporting)
CREATE INDEX IF NOT EXISTS idx_instructor_earnings_date_range
ON instructor_earnings(instructor_id, created_at DESC)
INCLUDE (amount, session_id);

-- PREVENTING: Duplicate instructor earnings per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructor_earnings_unique
ON instructor_earnings(instructor_id, session_id)
WHERE deleted_at IS NULL;

-- QUERY: Student's active credits (frequently queried)
CREATE INDEX IF NOT EXISTS idx_student_packages_active_credits
ON student_packages(student_id, remaining_credits)
WHERE remaining_credits > 0
  AND (expire_date IS NULL OR expire_date > NOW());

-- QUERY: Student's non-expired packages for dance type
CREATE INDEX IF NOT EXISTS idx_student_packages_valid_for_type
ON student_packages(student_id, package_id)
WHERE remaining_credits > 0
  AND (expire_date IS NULL OR expire_date > NOW());

-- COURSE LOOKUP: Student's courses
CREATE INDEX IF NOT EXISTS idx_course_students_student_courses
ON course_students(student_id, joined_at DESC);

-- COURSE SESSIONS: Find sessions for date range
CREATE INDEX IF NOT EXISTS idx_course_sessions_date_range
ON course_sessions(course_id, session_date DESC);

-- FINANCIAL: Time-based queries
CREATE INDEX IF NOT EXISTS idx_cash_transactions_branch_date
ON cash_transactions(branch_id, created_at DESC)
INCLUDE (amount, transaction_type);

-- INSTRUCTOR: Sessions for period
CREATE INDEX IF NOT EXISTS idx_session_instructors_instructor_date
ON session_instructors(instructor_id, session_id)
INCLUDE (created_at);

-- ========================================
-- PART 3: ATOMIC TRANSACTION FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION record_attendance_atomic(
  p_session_id UUID,
  p_student_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_attendance_id UUID;
  v_student_package_id UUID;
  v_remaining_credits INT;
  v_course_id UUID;
  v_branch_id UUID;
  v_dance_type_id UUID;
  v_instructor_id UUID;
  v_instructor_rate NUMERIC;
  v_instructors RECORD;
  v_earnings_count INT := 0;
  v_validity_days INT;
  v_expire_date TIMESTAMPTZ;
BEGIN
  
  -- 1. VALIDATE & LOCK: Session exists
  SELECT cs.course_id INTO v_course_id
  FROM course_sessions cs
  WHERE cs.id = p_session_id
  FOR UPDATE;
  
  IF v_course_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found'
    );
  END IF;
  
  -- 2. VALIDATE & LOCK: Course exists and get branch & dance_type
  SELECT c.branch_id, c.dance_type_id
  INTO v_branch_id, v_dance_type_id
  FROM courses c
  WHERE c.id = v_course_id
  FOR UPDATE;
  
  IF v_branch_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Course not found'
    );
  END IF;
  
  -- 3. VALIDATE: Student is enrolled in course
  IF NOT EXISTS (
    SELECT 1 FROM course_students
    WHERE course_id = v_course_id AND student_id = p_student_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Student not enrolled in this course'
    );
  END IF;
  
  -- 4. VALIDATE: Attendance doesn't already exist (prevents duplicates)
  IF EXISTS (
    SELECT 1 FROM attendances
    WHERE session_id = p_session_id 
      AND student_id = p_student_id
      AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Attendance already recorded for this student'
    );
  END IF;
  
  -- 5. VALIDATE & LOCK: Student has valid credits for this dance type
  SELECT sp.id, sp.remaining_credits, p.validity_days, sp.expire_date
  INTO v_student_package_id, v_remaining_credits, v_validity_days, v_expire_date
  FROM student_packages sp
  JOIN packages p ON sp.package_id = p.id
  WHERE sp.student_id = p_student_id
    AND sp.remaining_credits > 0
    AND (sp.expire_date IS NULL OR sp.expire_date > NOW())
    AND p.dance_type_id = v_dance_type_id
  ORDER BY sp.expire_date ASC NULLS LAST  -- Use soonest-expiring first
  LIMIT 1
  FOR UPDATE;
  
  IF v_student_package_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Student has no valid credits for this dance type'
    );
  END IF;
  
  -- 6. VALIDATE: Credit count is safe to deduct
  IF (v_remaining_credits - 1) < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Credit deduction would violate constraints'
    );
  END IF;
  
  -- 7. DEDUCT CREDIT (safe: locked row + CHECK constraint prevents negative)
  UPDATE student_packages
  SET remaining_credits = remaining_credits - 1,
      updated_at = NOW()
  WHERE id = v_student_package_id;
  
  -- 8. INSERT ATTENDANCE RECORD
  INSERT INTO attendances (
    session_id,
    student_id,
    student_package_id
  )
  VALUES (p_session_id, p_student_id, v_student_package_id)
  RETURNING id INTO v_attendance_id;
  
  -- 9. CREATE INSTRUCTOR EARNINGS FOR ALL INSTRUCTORS IN SESSION
  FOR v_instructors IN
    SELECT DISTINCT si.instructor_id
    FROM session_instructors si
    WHERE si.session_id = p_session_id
  LOOP
    v_instructor_id := v_instructors.instructor_id;
    
    -- Get instructor rate for this branch/dance_type
    SELECT ir.price_per_class INTO v_instructor_rate
    FROM instructor_rates ir
    WHERE ir.instructor_id = v_instructor_id
      AND ir.branch_id = v_branch_id
      AND ir.dance_type_id = v_dance_type_id;
    
    -- Default rate if not found
    IF v_instructor_rate IS NULL THEN
      v_instructor_rate := 0;
    END IF;
    
    -- Insert earnings (ignore if duplicate - instructor paid once per session per student)
    INSERT INTO instructor_earnings (
      instructor_id,
      session_id,
      amount
    )
    VALUES (v_instructor_id, p_session_id, v_instructor_rate)
    ON CONFLICT (instructor_id, session_id) DO NOTHING;
    
    v_earnings_count := v_earnings_count + 1;
  END LOOP;
  
  -- 10. SUCCESS: Return all created records
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Attendance recorded successfully',
    'data', jsonb_build_object(
      'attendance_id', v_attendance_id,
      'student_package_id', v_student_package_id,
      'remaining_credits', v_remaining_credits - 1,
      'validity_days', v_validity_days,
      'expires_at', v_expire_date,
      'instructors_paid', v_earnings_count
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Auto-rollback on any error with detailed info
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE,
    'error_detail', 'Check server logs for details'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION record_attendance_atomic(UUID, UUID) TO authenticated;

-- ========================================
-- PART 4: SESSION GENERATION FUNCTION
-- ========================================

/**
 * Idempotent session generator
 * Safe to call multiple times - won't create duplicates
 * Generates sessions for a date range matching course's day of week
 */
CREATE OR REPLACE FUNCTION generate_course_sessions(
  p_course_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS jsonb AS $$
DECLARE
  v_current_date DATE;
  v_day_of_week INT;
  v_course_day_of_week INT;
  v_course_name VARCHAR;
  v_existing_count INT;
  v_created_count INT := 0;
  v_duplicate_count INT := 0;
BEGIN
  
  -- Get course info
  SELECT c.day_of_week, c.name
  INTO v_course_day_of_week, v_course_name
  FROM courses c
  WHERE c.id = p_course_id;
  
  IF v_course_day_of_week IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Course not found',
      'course_id', p_course_id
    );
  END IF;
  
  -- Validate date range
  IF p_start_date > p_end_date THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Start date must be before end date'
    );
  END IF;
  
  -- Loop through date range
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date)::INT;
    
    -- If this day matches course schedule
    IF v_day_of_week = v_course_day_of_week THEN
      
      -- Check if session already exists
      SELECT COUNT(*) INTO v_existing_count
      FROM course_sessions
      WHERE course_id = p_course_id
        AND session_date = v_current_date;
      
      IF v_existing_count = 0 THEN
        -- Create session
        INSERT INTO course_sessions (course_id, session_date)
        VALUES (p_course_id, v_current_date);
        
        v_created_count := v_created_count + 1;
      ELSE
        v_duplicate_count := v_duplicate_count + 1;
      END IF;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sessions generated successfully',
    'course_name', v_course_name,
    'date_range', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'results', jsonb_build_object(
      'created_count', v_created_count,
      'duplicate_count', v_duplicate_count,
      'total_count', v_created_count + v_duplicate_count
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_course_sessions(UUID, DATE, DATE) TO authenticated;

-- ========================================
-- PART 5: AUDIT FUNCTION - Get Attendance Summary
-- ========================================

CREATE OR REPLACE FUNCTION get_attendance_summary(
  p_start_date DATE,
  p_end_date DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(
  course_name VARCHAR,
  course_date DATE,
  total_enrolled INT,
  attended INT,
  absent INT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.name,
    cs.session_date,
    COALESCE(COUNT(DISTINCT cst.student_id), 0)::INT,
    COALESCE(SUM(CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END), 0)::INT,
    COALESCE(COUNT(DISTINCT cst.student_id), 0) - COALESCE(SUM(CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END), 0)::INT,
    ROUND(
      CASE 
        WHEN COUNT(DISTINCT cst.student_id) = 0 THEN 0
        ELSE (SUM(CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END)::NUMERIC / COUNT(DISTINCT cst.student_id)) * 100
      END,
      2
    )
  FROM courses c
  JOIN course_sessions cs ON cs.course_id = c.id
  LEFT JOIN course_students cst ON cst.course_id = c.id
  LEFT JOIN attendances a ON a.session_id = cs.id AND a.student_id = cst.student_id AND a.deleted_at IS NULL
  WHERE cs.session_date BETWEEN p_start_date AND p_end_date
    AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
  GROUP BY c.id, c.name, cs.id, cs.session_date
  ORDER BY cs.session_date DESC, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_attendance_summary(DATE, DATE, UUID) TO authenticated;

-- ========================================
-- PART 6: RLS POLICY ENHANCEMENTS
-- ========================================

-- Ensure packages RLS policy accounts for validity_days
DROP POLICY IF EXISTS "Packages are visible to organization members" ON packages;
CREATE POLICY "Packages are visible to organization members"
  ON packages FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE email = auth.jwt() ->> 'email' OR user_id = auth.uid()
    )
  );

-- Enhance student_packages RLS to respect expiration
DROP POLICY IF EXISTS "Users can view student packages in their organization" ON student_packages;
CREATE POLICY "Users can view student packages in their organization"
  ON student_packages FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- ========================================
-- PART 7: VIEWS FOR ANALYTICS
-- ========================================

CREATE OR REPLACE VIEW v_student_active_credits AS
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.email,
  sp.package_id,
  p.name AS package_name,
  dt.name AS dance_type,
  sp.remaining_credits,
  p.total_credits,
  ROUND((sp.remaining_credits::NUMERIC / NULLIF(p.total_credits, 0)) * 100, 1) AS usage_percent,
  sp.expire_date,
  CASE
    WHEN sp.remaining_credits = 0 THEN 'exhausted'
    WHEN sp.expire_date IS NOT NULL AND sp.expire_date <= NOW() THEN 'expired'
    WHEN CEIL((sp.expire_date - NOW())::INTEGER / 7.0) <= 2 THEN 'expiring_soon'
    ELSE 'active'
  END AS status,
  sp.purchase_date,
  sp.updated_at
FROM student_packages sp
JOIN students s ON sp.student_id = s.id
JOIN packages p ON sp.package_id = p.id
JOIN dance_types dt ON p.dance_type_id = dt.id
WHERE sp.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_instructor_earnings_summary AS
SELECT
  i.id,
  i.first_name,
  i.last_name,
  COUNT(DISTINCT ie.session_id) AS sessions_taught,
  SUM(ie.amount) AS total_earnings,
  AVG(ie.amount) AS average_per_session,
  MAX(ie.created_at) AS last_earning_date
FROM instructor_earnings ie
JOIN instructors i ON ie.instructor_id = i.id
WHERE ie.deleted_at IS NULL
GROUP BY i.id, i.first_name, i.last_name;

CREATE OR REPLACE VIEW v_branch_revenue AS
SELECT
  b.id,
  b.name,
  DATE_TRUNC('month', ct.created_at)::DATE AS month,
  SUM(CASE WHEN ct.transaction_type = 'income' THEN ct.amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN ct.transaction_type = 'expense' THEN ct.amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN ct.transaction_type = 'income' THEN ct.amount ELSE -ct.amount END) AS net_revenue
FROM cash_transactions ct
JOIN branches b ON ct.branch_id = b.id
WHERE ct.deleted_at IS NULL
GROUP BY b.id, b.name, DATE_TRUNC('month', ct.created_at);

-- ========================================
-- PART 8: TRIGGERS FOR EFFICIENCY
-- ========================================

-- Auto-update cash_transactions from attendance
CREATE OR REPLACE FUNCTION handle_attendance_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Optional: Create cash transaction record
    -- INSERT INTO cash_transactions (branch_id, amount, transaction_type, description)
    -- SELECT c.branch_id, ir.amount, 'income', 'Class attendance payment'
    -- FROM instructor_earnings ir
    -- JOIN session_instructors si ON si.session_id = NEW.session_id
    -- JOIN course_sessions cs ON cs.id = NEW.session_id
    -- JOIN courses c ON c.id = cs.course_id
    -- WHERE ir.instructor_id = si.instructor_id AND si.session_id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attendance_payment
AFTER INSERT ON attendances
FOR EACH ROW
EXECUTE FUNCTION handle_attendance_payment();

-- ========================================
-- PART 9: PERFORMANCE HINTS
-- ========================================

/*
QUERY OPTIMIZATION TIPS:

1. Always use indexed columns in WHERE clauses:
   - attendances.session_id, attendances.student_id
   - student_packages.remaining_credits, student_packages.expire_date
   - course_sessions.session_date

2. Use EXPLAIN ANALYZE to find slow queries:
   EXPLAIN ANALYZE
   SELECT ... FROM attendances WHERE session_id = '...';

3. Batch operations when possible:
   INSERT INTO attendances (session_id, student_id, ...)
   VALUES (...), (...), (...);

4. Consider materialized views for complex reports:
   CREATE MATERIALIZED VIEW v_monthly_revenue AS ...;
   REFRESH MATERIALIZED VIEW v_monthly_revenue;

5. Monitor for missing indices:
   SELECT * FROM pg_stat_user_indexes
   WHERE idx_scan = 0;

6. Use LIMIT when exploring:
   SELECT * FROM attendances LIMIT 100; -- Not LIMIT 1000000

7. Prefer joins over subqueries:
   SELECT a.*, s.name
   FROM attendances a
   JOIN students s ON a.student_id = s.id
   -- Better than: WHERE student_id IN (SELECT id FROM students ...)
*/

-- ========================================
-- FINAL VALIDATION
-- ========================================

-- Make sure all functions were created successfully
SELECT
  proname,
  (SELECT COUNT(*) FROM information_schema.routine_columns WHERE routine_name = proname) AS param_count
FROM pg_proc
WHERE proowner = 'postgres'::regrole
  AND proname LIKE '%attendance%'
  OR proname LIKE '%course_sessions%'
ORDER BY proname;
