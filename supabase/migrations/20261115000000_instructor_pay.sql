-- Instructor pay: rate history and pay models, earnings date/breakdown/manual flag,
-- extra items (adjustments), payouts and closed pay periods. Idempotent.
--
-- New tables are accessed only through server actions with the service-role client
-- (role-checked and scoped to the organization), so RLS is on with no policies.

-- ---------------------------------------------------------------------
-- 1) Pay model on instructor_rates (mirrors the version in force today)
-- ---------------------------------------------------------------------
ALTER TABLE public.instructor_rates
  ADD COLUMN IF NOT EXISTS pay_model TEXT NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS min_amount NUMERIC(10, 2);
ALTER TABLE public.instructor_rates ALTER COLUMN ratio_per_class SET DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructor_rates_pay_model_check') THEN
    ALTER TABLE public.instructor_rates ADD CONSTRAINT instructor_rates_pay_model_check
      CHECK (pay_model IN ('percentage', 'per_lesson', 'per_hour', 'per_student'));
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2) Rate versions: each change starts on a date; a lesson uses the version
--    in force on its date, so later changes never rewrite past pay.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_rate_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_id        UUID NOT NULL REFERENCES public.instructor_rates(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  pay_model      TEXT NOT NULL CHECK (pay_model IN ('percentage', 'per_lesson', 'per_hour', 'per_student')),
  ratio          NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (ratio >= 0 AND ratio <= 100),
  amount         NUMERIC(10, 2) CHECK (amount IS NULL OR amount >= 0),
  min_amount     NUMERIC(10, 2) CHECK (min_amount IS NULL OR min_amount >= 0),
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rate_id, effective_from),
  CONSTRAINT instructor_rate_versions_value_check CHECK (
    (pay_model = 'percentage' AND ratio > 0)
    OR (pay_model <> 'percentage' AND amount IS NOT NULL AND amount > 0)
  )
);
CREATE INDEX IF NOT EXISTS idx_instructor_rate_versions_created_by ON public.instructor_rate_versions(created_by);

-- Every existing rate gets one version that has always been in force
INSERT INTO public.instructor_rate_versions (rate_id, effective_from, pay_model, ratio)
SELECT r.id, DATE '2000-01-01', 'percentage', r.ratio_per_class
FROM public.instructor_rates r
WHERE r.ratio_per_class > 0
  AND NOT EXISTS (SELECT 1 FROM public.instructor_rate_versions v WHERE v.rate_id = r.id);

-- ---------------------------------------------------------------------
-- 3) Earnings: lesson date, manual override flag, calculated amount, breakdown
-- ---------------------------------------------------------------------
ALTER TABLE public.instructor_earnings
  ADD COLUMN IF NOT EXISTS earned_on DATE,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calculated_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS breakdown JSONB;

UPDATE public.instructor_earnings e
SET earned_on = s.session_date
FROM public.course_sessions s
WHERE s.id = e.session_id AND e.earned_on IS NULL;

UPDATE public.instructor_earnings SET calculated_amount = amount WHERE calculated_amount IS NULL;

ALTER TABLE public.instructor_earnings ALTER COLUMN earned_on SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_instructor_earnings_instructor_earned_on
  ON public.instructor_earnings(instructor_id, earned_on);
CREATE INDEX IF NOT EXISTS idx_instructor_earnings_earned_on ON public.instructor_earnings(earned_on);

COMMENT ON COLUMN public.instructor_earnings.earned_on IS 'Date of the lesson (course_sessions.session_date); periods and reports use this, not created_at';
COMMENT ON COLUMN public.instructor_earnings.is_manual IS 'Amount was set by hand; recalculation keeps it and only refreshes calculated_amount/breakdown';
COMMENT ON COLUMN public.instructor_earnings.breakdown IS 'How the amount was calculated: pay model, rate, counted students and their lesson values';

-- ---------------------------------------------------------------------
-- 4) Extra items: bonus, deduction, private lesson, travel, automatic corrections
--    (amount is signed: deductions are negative)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_adjustments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instructor_id     UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  applies_on        DATE NOT NULL,
  kind              TEXT NOT NULL CHECK (kind IN ('bonus', 'deduction', 'private_lesson', 'travel', 'correction', 'other')),
  amount            NUMERIC(10, 2) NOT NULL CHECK (amount <> 0),
  description       TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  source_session_id UUID REFERENCES public.course_sessions(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instructor_adjustments_org_id ON public.instructor_adjustments(organization_id);
CREATE INDEX IF NOT EXISTS idx_instructor_adjustments_instructor_applies_on
  ON public.instructor_adjustments(instructor_id, applies_on);
CREATE INDEX IF NOT EXISTS idx_instructor_adjustments_source_session_id ON public.instructor_adjustments(source_session_id);
CREATE INDEX IF NOT EXISTS idx_instructor_adjustments_created_by ON public.instructor_adjustments(created_by);

-- ---------------------------------------------------------------------
-- 5) Payouts: each one is also an expense in the cash register.
--    Deleting the cash transaction deletes the payout.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instructor_id       UUID NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  branch_id           UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  cash_transaction_id UUID UNIQUE REFERENCES public.cash_transactions(id) ON DELETE CASCADE,
  amount              NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  paid_on             DATE NOT NULL,
  method              TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'bank_transfer', 'other')),
  note                TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_org_id ON public.instructor_payouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_instructor_paid_on ON public.instructor_payouts(instructor_id, paid_on);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_branch_id ON public.instructor_payouts(branch_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_created_by ON public.instructor_payouts(created_by);

-- ---------------------------------------------------------------------
-- 6) Closed pay periods (one row per closed month). In a closed month
--    earnings, items and payouts are locked; later changes become
--    correction items in the current month.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_pay_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_month    DATE NOT NULL CHECK (EXTRACT(DAY FROM period_month) = 1),
  closed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  summary         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_month)
);
CREATE INDEX IF NOT EXISTS idx_instructor_pay_periods_closed_by ON public.instructor_pay_periods(closed_by);

-- ---------------------------------------------------------------------
-- 7) RLS: new tables are service-role only
-- ---------------------------------------------------------------------
ALTER TABLE public.instructor_rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_adjustments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_payouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_pay_periods   ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.instructor_rate_versions, public.instructor_adjustments,
  public.instructor_payouts, public.instructor_pay_periods FROM anon, authenticated;

COMMENT ON TABLE public.instructor_rate_versions IS 'Dated versions of an instructor rate. RLS on, no policies: service role only (server actions).';
COMMENT ON TABLE public.instructor_adjustments   IS 'Extra pay items and corrections. RLS on, no policies: service role only (server actions).';
COMMENT ON TABLE public.instructor_payouts       IS 'Payments made to instructors. RLS on, no policies: service role only (server actions).';
COMMENT ON TABLE public.instructor_pay_periods   IS 'Closed pay months. RLS on, no policies: service role only (server actions).';

-- Earnings: only owners and managers may read or change them through the user client
-- (instructors see their own statement through a server action).
DROP POLICY IF EXISTS "instructor_earnings: members read"   ON public.instructor_earnings;
DROP POLICY IF EXISTS "instructor_earnings: members update" ON public.instructor_earnings;
DROP POLICY IF EXISTS "instructor_earnings: members delete" ON public.instructor_earnings;
DROP POLICY IF EXISTS "instructor_earnings: managers read"   ON public.instructor_earnings;
DROP POLICY IF EXISTS "instructor_earnings: managers update" ON public.instructor_earnings;
DROP POLICY IF EXISTS "instructor_earnings: managers delete" ON public.instructor_earnings;

CREATE POLICY "instructor_earnings: managers read" ON public.instructor_earnings FOR SELECT TO authenticated
  USING (public.instructor_org_id(instructor_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner', 'manager'])));
CREATE POLICY "instructor_earnings: managers update" ON public.instructor_earnings FOR UPDATE TO authenticated
  USING      (public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner', 'manager'])))
  WITH CHECK (public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner', 'manager'])));
CREATE POLICY "instructor_earnings: managers delete" ON public.instructor_earnings FOR DELETE TO authenticated
  USING (public.session_org_id(session_id) IN (SELECT public.user_org_ids_with_role(ARRAY['owner', 'manager'])));

-- ---------------------------------------------------------------------
-- 8) updated_at triggers
-- ---------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'instructor_rate_versions', 'instructor_adjustments', 'instructor_payouts', 'instructor_pay_periods'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;
