-- Demo requests from the public landing page. Written and read only with the service role
-- (server action + backoffice), so RLS is on with no policies.
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  studio_name text NOT NULL CHECK (char_length(studio_name) BETWEEN 2 AND 160),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 30),
  email text CHECK (email IS NULL OR char_length(email) <= 254),
  city text CHECK (city IS NULL OR char_length(city) <= 80),
  student_count text CHECK (student_count IS NULL OR student_count IN ('lt50', '50to150', '150to400', 'gt400')),
  message text CHECK (message IS NULL OR char_length(message) <= 2000),
  locale text NOT NULL DEFAULT 'tr',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_phone ON public.demo_requests (phone);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.demo_requests FROM anon, authenticated;

COMMENT ON TABLE public.demo_requests IS
  'Landing page demo requests. RLS enabled with no policies on purpose: accessed only via the service role.';
