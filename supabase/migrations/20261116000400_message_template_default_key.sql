-- Default message templates get a key, unique per organization, so seeding them can never
-- create duplicates (concurrent page loads used to insert the same default many times).
-- Also removes the duplicates that were created. Idempotent.
ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS default_key TEXT;
COMMENT ON COLUMN public.message_templates.default_key IS 'Which built-in default this template was created from (null for templates the studio wrote)';

-- Rows created while the default texts were missing carry the translation key as their name
DELETE FROM public.message_templates WHERE name LIKE 'messages.defaults.%';

-- Tag the remaining defaults by their Turkish / English names
UPDATE public.message_templates SET default_key = k.key
FROM (VALUES
  ('paymentReminder', 'Ödeme hatırlatma'), ('paymentReminder', 'Payment reminder'),
  ('packageExpiring', 'Paket süresi doluyor'), ('packageExpiring', 'Package ending'),
  ('event', 'Etkinlik daveti'), ('event', 'Event invitation'),
  ('announcement', 'Genel duyuru'), ('announcement', 'General announcement'),
  ('birthday', 'Doğum günü kutlama'), ('birthday', 'Birthday greeting'),
  ('classInvite', 'Derse davet'), ('classInvite', 'Class invite')
) AS k(key, name)
WHERE message_templates.name = k.name AND message_templates.default_key IS NULL;

-- Keep the oldest copy of each default per organization
DELETE FROM public.message_templates mt
USING public.message_templates keep
WHERE mt.default_key IS NOT NULL
  AND keep.organization_id = mt.organization_id
  AND keep.default_key = mt.default_key
  AND (keep.created_at, keep.id) < (mt.created_at, mt.id);

-- Not partial, so it can back ON CONFLICT (organization_id, default_key); NULLs (the studio's
-- own templates) never conflict with each other
CREATE UNIQUE INDEX IF NOT EXISTS uq_message_templates_org_default_key
  ON public.message_templates (organization_id, default_key);
