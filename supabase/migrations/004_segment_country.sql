-- ============================================================
-- Add segment and country columns to opportunities
-- ============================================================

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS segment text,
  ADD COLUMN IF NOT EXISTS country text;

CREATE INDEX IF NOT EXISTS idx_opportunities_org_segment
  ON public.opportunities (org_id, segment);

CREATE INDEX IF NOT EXISTS idx_opportunities_org_country
  ON public.opportunities (org_id, country);
