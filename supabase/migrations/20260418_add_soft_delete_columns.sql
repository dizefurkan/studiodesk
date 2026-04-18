-- Add soft delete support columns to content entities
-- Pattern: deleted_at IS NULL = active, deleted_at IS NOT NULL = soft deleted
-- Includes: who deleted it (deleted_by) and why (deleted_reason)

-- ========================================
-- STUDENTS
-- ========================================
ALTER TABLE students 
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES profiles(id),
  ADD COLUMN deleted_reason TEXT;

-- ========================================
-- COURSES
-- ========================================
ALTER TABLE courses 
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES profiles(id),
  ADD COLUMN deleted_reason TEXT;

-- ========================================
-- INSTRUCTORS
-- ========================================
ALTER TABLE instructors 
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES profiles(id),
  ADD COLUMN deleted_reason TEXT;

-- ========================================
-- BRANCHES
-- ========================================
ALTER TABLE branches 
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES profiles(id),
  ADD COLUMN deleted_reason TEXT;

-- ========================================
-- DANCE_TYPES
-- ========================================
ALTER TABLE dance_types 
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES profiles(id),
  ADD COLUMN deleted_reason TEXT;

-- ========================================
-- PACKAGES
-- ========================================
ALTER TABLE packages 
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES profiles(id),
  ADD COLUMN deleted_reason TEXT;

-- ========================================
-- INDEXES FOR SOFT DELETE FILTERING
-- ========================================
-- Optimize queries that filter for active records (deleted_at IS NULL)
CREATE INDEX idx_students_deleted_at ON students(deleted_at);
CREATE INDEX idx_courses_deleted_at ON courses(deleted_at);
CREATE INDEX idx_instructors_deleted_at ON instructors(deleted_at);
CREATE INDEX idx_branches_deleted_at ON branches(deleted_at);
CREATE INDEX idx_dance_types_deleted_at ON dance_types(deleted_at);
CREATE INDEX idx_packages_deleted_at ON packages(deleted_at);

-- Optimize queries that look up who deleted what
CREATE INDEX idx_students_deleted_by ON students(deleted_by);
CREATE INDEX idx_courses_deleted_by ON courses(deleted_by);
CREATE INDEX idx_instructors_deleted_by ON instructors(deleted_by);
CREATE INDEX idx_branches_deleted_by ON branches(deleted_by);
CREATE INDEX idx_dance_types_deleted_by ON dance_types(deleted_by);
CREATE INDEX idx_packages_deleted_by ON packages(deleted_by);
