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
lib/
  supabase/
    client.ts           # Browser Supabase client
    server.ts           # Server Supabase client (uses cookies)
    middleware.ts        # Session refresh logic for middleware
middleware.ts           # Next.js middleware for route protection
next.config.ts          # Next.js configuration
tailwind.config.ts      # Tailwind configuration
postcss.config.mjs      # PostCSS configuration
.env.example            # Required env vars template
```

## Auth Flow
1. Middleware intercepts all requests
2. Unauthenticated users accessing /app/* are redirected to /login
3. Authenticated users accessing /login or /signup are redirected to /app
4. Root (/) redirects based on auth status

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for browser)

## Run Instructions
- Dev: `npm run dev` (Next.js dev server on port 5000)
- Build: `npm run build`
- Start: `npm run start`

## Recent Changes
- 2026-02-10: Initial setup - Next.js App Router + Supabase auth with login, signup, and protected dashboard
