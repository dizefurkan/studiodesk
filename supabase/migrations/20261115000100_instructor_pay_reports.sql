-- Aggregates for instructor pay screens, computed in the database so totals never depend on
-- how many rows a request may return. Called only by server actions with the service role.

-- Per instructor of an organization: balance before p_from, and earnings / extra items /
-- payouts between p_from and p_to (inclusive). Closing balance = opening + earned + adjustments - paid.
CREATE OR REPLACE FUNCTION public.instructor_pay_balances(p_organization_id UUID, p_from DATE, p_to DATE)
RETURNS TABLE (
  instructor_id UUID,
  opening NUMERIC,
  earned NUMERIC,
  lesson_count BIGINT,
  adjustments NUMERIC,
  paid NUMERIC
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  WITH ins AS (
    SELECT id FROM public.instructors WHERE organization_id = p_organization_id
  ),
  e AS (
    SELECT e.instructor_id,
           SUM(e.amount) FILTER (WHERE e.earned_on < p_from) AS before,
           SUM(e.amount) FILTER (WHERE e.earned_on >= p_from) AS cur,
           COUNT(*)      FILTER (WHERE e.earned_on >= p_from) AS cnt
    FROM public.instructor_earnings e
    JOIN ins ON ins.id = e.instructor_id
    WHERE e.earned_on <= p_to
    GROUP BY e.instructor_id
  ),
  a AS (
    SELECT x.instructor_id,
           SUM(x.amount) FILTER (WHERE x.applies_on < p_from) AS before,
           SUM(x.amount) FILTER (WHERE x.applies_on >= p_from) AS cur
    FROM public.instructor_adjustments x
    WHERE x.organization_id = p_organization_id AND x.applies_on <= p_to
    GROUP BY x.instructor_id
  ),
  p AS (
    SELECT x.instructor_id,
           SUM(x.amount) FILTER (WHERE x.paid_on < p_from) AS before,
           SUM(x.amount) FILTER (WHERE x.paid_on >= p_from) AS cur
    FROM public.instructor_payouts x
    WHERE x.organization_id = p_organization_id AND x.paid_on <= p_to
    GROUP BY x.instructor_id
  )
  SELECT ins.id,
         COALESCE(e.before, 0) + COALESCE(a.before, 0) - COALESCE(p.before, 0),
         COALESCE(e.cur, 0),
         COALESCE(e.cnt, 0),
         COALESCE(a.cur, 0),
         COALESCE(p.cur, 0)
  FROM ins
  LEFT JOIN e ON e.instructor_id = ins.id
  LEFT JOIN a ON a.instructor_id = ins.id
  LEFT JOIN p ON p.instructor_id = ins.id;
$$;

-- Per course: lessons held, attendance, revenue (value of the lessons that took a credit:
-- what the student paid for the package / its lessons, list price when nothing was paid)
-- and instructor cost (earnings + automatic corrections of those lessons).
CREATE OR REPLACE FUNCTION public.course_profitability(
  p_organization_id UUID,
  p_from DATE,
  p_to DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  course_id UUID,
  course_name TEXT,
  branch_name TEXT,
  dance_type_name TEXT,
  session_count BIGINT,
  present_count BIGINT,
  credit_count BIGINT,
  revenue NUMERIC,
  instructor_cost NUMERIC
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  WITH s AS (
    SELECT cs.id, cs.course_id
    FROM public.course_sessions cs
    JOIN public.courses c  ON c.id = cs.course_id
    JOIN public.branches b ON b.id = c.branch_id
    WHERE b.organization_id = p_organization_id
      AND cs.session_date BETWEEN p_from AND p_to
      AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
  ),
  paid AS (
    SELECT t.student_package_id, SUM(t.amount) AS amount
    FROM public.cash_transactions t
    JOIN public.branches b ON b.id = t.branch_id
    WHERE b.organization_id = p_organization_id
      AND t.type = 'income' AND t.student_package_id IS NOT NULL
    GROUP BY t.student_package_id
  ),
  lv AS (
    SELECT sp.id, COALESCE(paid.amount, p.price) / NULLIF(p.total_credits, 0) AS value
    FROM public.student_packages sp
    JOIN public.packages p ON p.id = sp.package_id
    LEFT JOIN paid ON paid.student_package_id = sp.id
    WHERE p.organization_id = p_organization_id
  ),
  att AS (
    SELECT s.course_id,
           COUNT(DISTINCT s.id)                          AS sessions,
           COUNT(*) FILTER (WHERE a.is_present)          AS present,
           COUNT(*) FILTER (WHERE a.deduct_credits)      AS credits,
           SUM(lv.value) FILTER (WHERE a.deduct_credits) AS revenue
    FROM s
    JOIN public.attendances a ON a.session_id = s.id
    LEFT JOIN lv ON lv.id = a.student_package_id
    GROUP BY s.course_id
  ),
  cost AS (
    SELECT x.course_id, SUM(x.amount) AS amount
    FROM (
      SELECT s.course_id, e.amount
      FROM s JOIN public.instructor_earnings e ON e.session_id = s.id
      UNION ALL
      SELECT s.course_id, j.amount
      FROM s JOIN public.instructor_adjustments j ON j.source_session_id = s.id
      WHERE j.organization_id = p_organization_id
    ) x
    GROUP BY x.course_id
  )
  SELECT c.id,
         c.name::TEXT,
         b.name::TEXT,
         d.name::TEXT,
         COALESCE(att.sessions, 0),
         COALESCE(att.present, 0),
         COALESCE(att.credits, 0),
         ROUND(COALESCE(att.revenue, 0), 2),
         COALESCE(cost.amount, 0)
  FROM public.courses c
  JOIN public.branches b    ON b.id = c.branch_id
  JOIN public.dance_types d ON d.id = c.dance_type_id
  LEFT JOIN att  ON att.course_id = c.id
  LEFT JOIN cost ON cost.course_id = c.id
  WHERE b.organization_id = p_organization_id
    AND (p_branch_id IS NULL OR c.branch_id = p_branch_id)
    AND (c.deleted_at IS NULL OR att.sessions > 0 OR cost.amount IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION public.instructor_pay_balances(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.course_profitability(UUID, DATE, DATE, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.instructor_pay_balances(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.course_profitability(UUID, DATE, DATE, UUID) TO service_role;
