-- ============================================================
-- Add date columns to opportunities for date-mode filtering
-- ============================================================

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS closed_date timestamptz,
  ADD COLUMN IF NOT EXISTS pipeline_accepted_date timestamptz;

-- Composite indexes for tenant-scoped date filtering
CREATE INDEX IF NOT EXISTS idx_opportunities_org_closed
  ON public.opportunities (org_id, closed_date);

CREATE INDEX IF NOT EXISTS idx_opportunities_org_pipeline
  ON public.opportunities (org_id, pipeline_accepted_date);

CREATE INDEX IF NOT EXISTS idx_opportunities_org_created
  ON public.opportunities (org_id, created_at);
