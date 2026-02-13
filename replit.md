# SaaS App - Multi-Tenant Next.js + Supabase

## Overview
Multi-tenant SaaS application built with Next.js App Router, Supabase (Auth + Postgres), and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Auth & DB**: Supabase (Auth for signup/login, Postgres for data)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure
```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout with Inter font
  page.tsx              # Root redirect (to /app or /login)
  globals.css           # Tailwind + CSS variables
  login/page.tsx        # Login page (client component)
  signup/page.tsx       # Signup page (client component)
  app/page.tsx          # Protected dashboard (server component)
  app/sign-out-button.tsx  # Client-side sign out button
  api/bootstrap/route.ts   # POST endpoint to create org + membership on signup
  api/import/upload/route.ts  # POST: parse CSV, return headers + preview
  api/import/execute/route.ts # POST: validate + insert opportunities from CSV
  api/import/jobs/route.ts    # GET: list import jobs for current org
  api/analytics/summary/route.ts # GET: tenant-scoped analytics summary JSON
  api/analytics/dimensions/route.ts # GET: distinct dimension values for filter UI
  api/ai/analyze/route.ts  # POST: AI-powered pipeline analysis via OpenAI
  app/import/page.tsx      # CSV upload + column mapping + import UI
  app/dashboard/page.tsx   # Analytics dashboard with KPIs, breakdowns, and AI insights
lib/
  supabase/
    client.ts           # Browser Supabase client
    server.ts           # Server Supabase client (uses cookies)
    middleware.ts        # Session refresh logic for middleware
middleware.ts           # Next.js middleware for route protection
supabase/
  migrations/
    001_multitenant.sql  # Multi-tenant schema: organizations, profiles, memberships + RLS
next.config.ts          # Next.js configuration
tailwind.config.ts      # Tailwind configuration
postcss.config.mjs      # PostCSS configuration
.env.example            # Required env vars template
```

## Database Schema
- **organizations**: id (uuid pk), name, created_at
- **profiles**: id (uuid pk, FK auth.users), email, created_at
- **memberships**: id (uuid pk), org_id (FK organizations), user_id (FK auth.users), role (admin|member|viewer), created_at
- **opportunities**: id (uuid pk), org_id (FK organizations), import_job_id (uuid nullable FK import_jobs), name, role, industry, source, amount (numeric), outcome (open|won|lost), created_at, closed_date (timestamptz nullable), pipeline_accepted_date (timestamptz nullable), segment (text nullable), country (text nullable)
- **import_jobs**: id (uuid pk), org_id (FK organizations), user_id (FK auth.users), filename, inserted_count, error_count, skipped_count, row_count, status (pending|running|completed|failed), is_active (bool), import_mode (append|replace), mapping_config (jsonb), started_at (timestamptz), completed_at (timestamptz), created_at
- **import_errors**: id (uuid pk), job_id (FK import_jobs), row_number, error_message, raw_row_json (jsonb), created_at

## Auth & Tenant Flow
1. Middleware intercepts all requests, refreshes session
2. Unauthenticated users accessing /app/* are redirected to /login
3. Authenticated users accessing /login or /signup are redirected to /app
4. Root (/) redirects based on auth status
5. On signup: trigger creates profile row; API route calls `bootstrap_org` RPC to create org + admin membership

## Row Level Security
- **profiles**: users can SELECT/UPDATE only their own row
- **memberships**: users can SELECT only their own memberships
- **organizations**: members can SELECT their org; admins can UPDATE
- `bootstrap_org` RPC uses SECURITY DEFINER to bypass RLS during signup bootstrap

## Date Filtering
- **Date Modes**: closed_date, pipeline_accepted_date, created_at - selects which date column to filter on
- **Time Periods**: 7d, 30d, 90d, mtd (month-to-date), qtd (quarter-to-date), custom (with from/to dates)
- **Shared Logic**: lib/date-filter.ts - resolveDateFilter() computes dateFrom/dateTo from mode+period params
- **Dashboard UI**: Filter bar with Date Mode dropdown, Time Period dropdown, optional custom date inputs; selections sync to URL query params
- **Migration**: supabase/migrations/003_date_columns.sql adds closed_date, pipeline_accepted_date columns + composite indexes

## Dimension Filtering
- **Dimensions**: segment, country, source, industry, role (labeled "Champion Role" in UI)
- **Shared Logic**: lib/dimension-filter.ts - parse/apply/describe dimension filters with "Unknown" for NULL values
- **Dimensions Endpoint**: GET /api/analytics/dimensions - returns distinct values per dimension scoped to org_id + current date window
- **Analytics Integration**: GET /api/analytics/summary accepts dimension filter arrays in query params (e.g. segment=SaaS&segment=Enterprise); filters applied in-memory after date+org fetch
- **AI Integration**: POST /api/ai/analyze accepts dimension filter arrays in body; AI prompt includes active filter context
- **Dashboard UI**: Collapsible "Filters" panel with multi-select checkboxes per dimension, "Unknown" option for nulls, Clear All button; selections persist in URL query params
- **Import Normalization**: All dimension fields trimmed; empty strings stored as NULL; segment and country are optional CSV mapping fields
- **Migration**: supabase/migrations/004_segment_country.sql adds segment, country columns + composite indexes

## Dataset Persistence
- **Import Job Lifecycle**: pending → running → completed/failed; each job tracks row_count, inserted_count, error_count, skipped_count, mapping_config, import_mode
- **Opportunity Tagging**: Every imported opportunity is stamped with import_job_id FK linking to import_jobs
- **Import Modes**: append (keep existing data) | replace (delete all prior org opportunities, mark old jobs inactive)
- **Replace Mode**: Confirmation modal required; deletes all existing opportunities; marks all prior import_jobs as is_active=false
- **NULL Handling**: Values "NA", "N/A", "null", "none", empty string, "-" are treated as NULL for optional fields
- **Import History**: GET /api/import/jobs - lists up to 50 recent imports with status, counts, dates, mode; import page shows history table
- **Dataset Selector**: Dashboard filter bar includes Dataset dropdown (only shown when datasets exist); "All Data" or specific import; persists in URL via ?dataset=<job_id>
- **Analytics Scoping**: All three endpoints (summary, dimensions, ai/analyze) accept optional dataset query/body param to filter by import_job_id
- **Migration**: supabase/migrations/005_dataset_persistence.sql adds import_job_id to opportunities, lifecycle columns to import_jobs

## AI Analysis
- **Endpoint**: POST /api/ai/analyze - tenant-scoped analytics sent to OpenAI for structured JSON insights
- **Model**: gpt-5.2 via OpenAI Responses API with JSON output format
- **SDK**: openai (Node.js)
- **Security**: API key server-side only via process.env.OPENAI_API_KEY
- **Date Context**: AI prompt includes date mode, time window, opportunity count, and dataset context; summary must mention these
- **Request Body**: { date_mode, period, from?, to?, dataset?, segment?[], country?[], source?[], industry?[], role?[] } - date + dimension + dataset filter params
- **Response**: { analysis: { summary, insights[], recommendations[] }, filter: { dateMode, dateModeLabel, dateFrom, dateTo, periodLabel, analyzedCount, excludedNullCount, datasetId, activeDimensionFilters } }

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for browser)
- `NEXT_PUBLIC_SITE_URL` - Full public URL of the app (e.g. `https://your-app.replit.dev`), used for email confirmation redirects
- `OPENAI_API_KEY` - OpenAI API key (server-side only, stored as secret)

## Supabase Dashboard Setup (Auth URL Configuration)
To ensure email confirmation links work correctly (especially on mobile):

1. Go to your **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Replit public URL, e.g.:
   `https://your-app-id.replit.dev`
3. Under **Redirect URLs**, add:
   `https://your-app-id.replit.dev/auth/callback`
4. Save changes

This ensures Supabase email confirmation links redirect to the correct domain instead of `localhost:3000`.

### Email Confirmation Flow
1. User signs up → Supabase sends confirmation email with link pointing to `NEXT_PUBLIC_SITE_URL/auth/callback`
2. User clicks link → `app/auth/callback/route.ts` exchanges the auth code for a session
3. User is redirected to `/app` (or `/login` on failure)

## Run Instructions
- Dev: `npm run dev` (Next.js dev server on port 5000)
- Build: `npm run build`
- Start: `npm run start`
- Apply migration: Run the SQL in `supabase/migrations/001_multitenant.sql` in Supabase SQL editor

## Recent Changes
- 2026-02-10: Initial setup - Next.js App Router + Supabase auth with login, signup, and protected dashboard
- 2026-02-10: Added multi-tenant schema with RLS, bootstrap API route, org display on dashboard
- 2026-02-10: Added CSV import feature for opportunities with column mapping, validation, and error tracking
- 2026-02-10: Added tenant-scoped analytics dashboard with KPIs and breakdowns by role, industry, source
- 2026-02-10: Added AI-powered analysis feature using OpenAI gpt-5.2 with structured JSON insights on dashboard
- 2026-02-10: Fixed email confirmation redirect - added NEXT_PUBLIC_SITE_URL, emailRedirectTo in signup, documented Supabase URL config
- 2026-02-12: Added date filtering - closed_date/pipeline_accepted_date columns, date mode + time period filter bar on dashboard, URL param sync, date-aware analytics API and AI analysis with temporal context
- 2026-02-12: Added dimension filtering - segment/country columns, collapsible multi-select filter panel, dimension-aware analytics + AI analysis, URL param persistence, import normalization
- 2026-02-13: Added dataset persistence - import_job_id FK on opportunities, job lifecycle tracking, replace/append modes with confirmation modal, import history table, dataset selector on dashboard, analytics scoping by dataset
