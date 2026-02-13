-- ============================================================
-- Dataset persistence: link opportunities to import jobs,
-- add job lifecycle tracking, mapping config storage
-- ============================================================

-- 1. Add import_job_id to opportunities (FK to import_jobs)
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS import_job_id uuid REFERENCES public.import_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_import_job_id
  ON public.opportunities (import_job_id);

-- 2. Add lifecycle columns to import_jobs
ALTER TABLE public.import_jobs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS row_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS skipped_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mapping_config jsonb,
  ADD COLUMN IF NOT EXISTS import_mode text NOT NULL DEFAULT 'append' CHECK (import_mode IN ('append', 'replace')),
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_import_jobs_org_active
  ON public.import_jobs (org_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_jobs_org_status
  ON public.import_jobs (org_id, status);
