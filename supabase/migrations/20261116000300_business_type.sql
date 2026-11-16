-- What kind of studio this is (dance, Pilates/yoga, martial arts, music/art, fitness, other).
-- Only used for wording and examples in the app; the data model is the same for all of them.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'dance'
  CHECK (business_type IN ('dance', 'pilates_yoga', 'martial_arts', 'music_art', 'fitness', 'other'));
COMMENT ON COLUMN public.organizations.business_type IS 'Kind of studio; drives examples and wording only';
