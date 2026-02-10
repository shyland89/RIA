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
  app/import/page.tsx      # CSV upload + column mapping + import UI
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
- **opportunities**: id (uuid pk), org_id (FK organizations), name, role, industry, source, amount (numeric), outcome (open|won|lost), created_at
- **import_jobs**: id (uuid pk), org_id (FK organizations), user_id (FK auth.users), filename, inserted_count, error_count, created_at
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

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for browser)

## Run Instructions
- Dev: `npm run dev` (Next.js dev server on port 5000)
- Build: `npm run build`
- Start: `npm run start`
- Apply migration: Run the SQL in `supabase/migrations/001_multitenant.sql` in Supabase SQL editor

## Recent Changes
- 2026-02-10: Initial setup - Next.js App Router + Supabase auth with login, signup, and protected dashboard
- 2026-02-10: Added multi-tenant schema with RLS, bootstrap API route, org display on dashboard
- 2026-02-10: Added CSV import feature for opportunities with column mapping, validation, and error tracking
