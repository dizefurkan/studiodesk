-- Categories for cash register entries. "other" needs a description (enforced in the app);
-- for every other category the description is an optional note. Idempotent.
ALTER TABLE public.cash_transactions ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';
ALTER TABLE public.cash_transactions DROP CONSTRAINT IF EXISTS cash_transactions_category_check;
ALTER TABLE public.cash_transactions ADD CONSTRAINT cash_transactions_category_check CHECK (category IN (
  -- income
  'package_sale', 'private_lesson', 'event', 'product_sale', 'rental',
  -- expense
  'rent', 'utilities', 'instructor_payment', 'salary', 'equipment', 'cleaning', 'marketing', 'tax', 'maintenance',
  -- both
  'other'
));
ALTER TABLE public.cash_transactions ALTER COLUMN description DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cash_transactions_category ON public.cash_transactions(category);

-- Existing entries: package sales and instructor payouts are known; the rest stay "other"
UPDATE public.cash_transactions SET category = 'package_sale'
 WHERE student_package_id IS NOT NULL AND category = 'other';
UPDATE public.cash_transactions ct SET category = 'instructor_payment'
  FROM public.instructor_payouts p
 WHERE p.cash_transaction_id = ct.id AND ct.category = 'other';
