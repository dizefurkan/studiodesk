-- Messages to students: reusable templates and a log of every message sent.
-- Phase 1 sends from the user's own phone (WhatsApp / SMS links); the log already carries
-- provider fields so an SMS / WhatsApp Business provider can be added later. Idempotent.
-- Tables are service-role only (server actions check the role and scope to the organization).

-- Students who don't want messages are left out of every recipient list
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS messages_opt_out BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN public.students.messages_opt_out IS 'Student does not want WhatsApp / SMS messages from the studio';

CREATE TABLE IF NOT EXISTS public.message_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  category        TEXT NOT NULL DEFAULT 'other'
                  CHECK (category IN ('payment_reminder', 'event', 'announcement', 'other')),
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_message_templates_org_id ON public.message_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON public.message_templates(created_by);

CREATE TABLE IF NOT EXISTS public.message_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id          UUID REFERENCES public.students(id) ON DELETE SET NULL,
  template_id         UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  channel             TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  recipient           TEXT NOT NULL,
  body                TEXT NOT NULL,
  -- manual: opened on the user's phone. Later, with a provider: queued / sent / delivered / failed
  status              TEXT NOT NULL DEFAULT 'manual'
                      CHECK (status IN ('manual', 'queued', 'sent', 'delivered', 'failed')),
  provider            TEXT,
  provider_message_id TEXT,
  error               TEXT,
  sent_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_message_logs_org_created ON public.message_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_student_id ON public.message_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_template_id ON public.message_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_by ON public.message_logs(sent_by);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs      ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.message_templates, public.message_logs FROM anon, authenticated;
COMMENT ON TABLE public.message_templates IS 'Message templates. RLS on, no policies: service role only (server actions).';
COMMENT ON TABLE public.message_logs      IS 'Messages sent to students. RLS on, no policies: service role only (server actions).';

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['message_templates', 'message_logs']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER update_%1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;
