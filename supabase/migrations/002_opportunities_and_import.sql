-- ============================================================
-- Opportunities + Import Jobs + Import Errors
-- ============================================================

-- 1. Opportunities (tenant-scoped)
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  industry text NOT NULL,
  source text NOT NULL,
  amount numeric NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('open', 'won', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Import Jobs (tracks each CSV import)
CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  inserted_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Import Errors (row-level errors per job)
CREATE TABLE public.import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  error_message text NOT NULL,
  raw_row_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;

-- Opportunities: users can SELECT their org's opportunities
CREATE POLICY "Members can read org opportunities"
  ON public.opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = opportunities.org_id
        AND memberships.user_id = auth.uid()
    )
  );

-- Opportunities: users can INSERT into their org
CREATE POLICY "Members can insert org opportunities"
  ON public.opportunities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = opportunities.org_id
        AND memberships.user_id = auth.uid()
    )
  );

-- Import Jobs: users can read their org's import jobs
CREATE POLICY "Members can read org import jobs"
  ON public.import_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = import_jobs.org_id
        AND memberships.user_id = auth.uid()
    )
  );

-- Import Jobs: users can insert import jobs for their org
CREATE POLICY "Members can insert org import jobs"
  ON public.import_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = import_jobs.org_id
        AND memberships.user_id = auth.uid()
    )
  );

-- Import Errors: users can read errors for jobs in their org
CREATE POLICY "Members can read org import errors"
  ON public.import_errors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.import_jobs j
      JOIN public.memberships m ON m.org_id = j.org_id
      WHERE j.id = import_errors.job_id
        AND m.user_id = auth.uid()
    )
  );

-- Import Errors: users can insert errors for jobs in their org
CREATE POLICY "Members can insert org import errors"
  ON public.import_errors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.import_jobs j
      JOIN public.memberships m ON m.org_id = j.org_id
      WHERE j.id = import_errors.job_id
        AND m.user_id = auth.uid()
    )
  );

-- Opportunities: members can update their org's opportunities
CREATE POLICY "Members can update org opportunities"
  ON public.opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = opportunities.org_id
        AND memberships.user_id = auth.uid()
    )
  );

-- Opportunities: members can delete their org's opportunities
CREATE POLICY "Members can delete org opportunities"
  ON public.opportunities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = opportunities.org_id
        AND memberships.user_id = auth.uid()
    )
  );

-- Import Jobs: members can update their org's import jobs
CREATE POLICY "Members can update org import jobs"
  ON public.import_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = import_jobs.org_id
        AND memberships.user_id = auth.uid()
    )
  );

-- Index for fast tenant lookups
CREATE INDEX idx_opportunities_org_id ON public.opportunities(org_id);
CREATE INDEX idx_import_jobs_org_id ON public.import_jobs(org_id);
CREATE INDEX idx_import_errors_job_id ON public.import_errors(job_id);
