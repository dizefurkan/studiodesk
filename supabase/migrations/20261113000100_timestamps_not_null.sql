-- Timestamp columns all default to now() but were nullable, which leaked `string | null`
-- into every generated type. Backfill and make them NOT NULL. Idempotent.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('created_at', 'updated_at', 'joined_at')
      AND is_nullable = 'YES'
      AND column_default = 'now()'
  LOOP
    EXECUTE format('UPDATE public.%I SET %I = now() WHERE %I IS NULL', r.table_name, r.column_name, r.column_name);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', r.table_name, r.column_name);
  END LOOP;
END $$;
