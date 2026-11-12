-- Backfill session_instructors from instructor_earnings
-- This fixes the data consistency issue where earnings exist without session_instructors

-- Step 1: Identify sessions that have earnings but no session_instructors
WITH sessions_with_inconsistency AS (
  SELECT DISTINCT ie.session_id
  FROM instructor_earnings ie
  WHERE NOT EXISTS (
    SELECT 1 FROM session_instructors si 
    WHERE si.session_id = ie.session_id
  )
)
-- Step 2: Insert missing session_instructors from earnings
INSERT INTO session_instructors (session_id, instructor_id)
SELECT DISTINCT ie.session_id, ie.instructor_id
FROM instructor_earnings ie
WHERE ie.session_id IN (SELECT session_id FROM sessions_with_inconsistency)
ON CONFLICT (session_id, instructor_id) DO NOTHING;

-- Verify the fix
SELECT 
  'Sessions with earnings but no session_instructors (should be 0):' as check_name,
  COUNT(DISTINCT ie.session_id) as count
FROM instructor_earnings ie
WHERE NOT EXISTS (
  SELECT 1 FROM session_instructors si 
  WHERE si.session_id = ie.session_id
);

-- Show all instructor_earnings and their session_instructors status
SELECT 
  ie.session_id,
  ie.instructor_id,
  COUNT(si.id) as session_instructor_count,
  COUNT(ie.id) as earnings_count
FROM instructor_earnings ie
LEFT JOIN session_instructors si ON ie.session_id = si.session_id AND ie.instructor_id = si.instructor_id
GROUP BY ie.session_id, ie.instructor_id
ORDER BY ie.session_id, ie.instructor_id;
