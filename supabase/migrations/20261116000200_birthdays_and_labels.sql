-- Student birthdays and labels (e.g. levels: Beginner / Intermediate / Advanced) on students and courses.
-- Labels let the studio find students of the same level to invite into a class that has free places.
-- Also adds the birthday and class-invite message categories. Idempotent.
-- Label tables are service-role only (server actions check the role and scope to the organization).

-- Birthday (the year may be unknown to the studio, but a full date is stored; the year is used for age)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS birth_date DATE CHECK (birth_date IS NULL OR birth_date >= DATE '1900-01-01');
COMMENT ON COLUMN public.students.birth_date IS 'Date of birth, used for birthday greetings';

CREATE TABLE IF NOT EXISTS public.labels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 40),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_labels_org_name ON public.labels(organization_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_labels_created_by ON public.labels(created_by);

CREATE TABLE IF NOT EXISTS public.student_labels (
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  label_id   UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, label_id)
);
CREATE INDEX IF NOT EXISTS idx_student_labels_label_id ON public.student_labels(label_id);

CREATE TABLE IF NOT EXISTS public.course_labels (
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  label_id   UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, label_id)
);
CREATE INDEX IF NOT EXISTS idx_course_labels_label_id ON public.course_labels(label_id);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_labels ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_labels_updated_at ON public.labels;
CREATE TRIGGER update_labels_updated_at
  BEFORE UPDATE ON public.labels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New message categories
ALTER TABLE public.message_templates DROP CONSTRAINT IF EXISTS message_templates_category_check;
ALTER TABLE public.message_templates ADD CONSTRAINT message_templates_category_check
  CHECK (category IN ('payment_reminder', 'event', 'announcement', 'birthday', 'class_invite', 'other'));

-- Which default templates a studio has already been given, so new defaults reach existing studios
-- once and a default the studio deleted does not come back.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS seeded_message_templates TEXT[] NOT NULL DEFAULT '{}';
UPDATE public.organizations o
   SET seeded_message_templates = ARRAY['paymentReminder', 'packageExpiring', 'event', 'announcement']
 WHERE cardinality(o.seeded_message_templates) = 0
   AND EXISTS (SELECT 1 FROM public.message_templates mt WHERE mt.organization_id = o.id);
