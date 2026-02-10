-- ============================================================
-- Multi-tenant schema: organizations, profiles, memberships
-- ============================================================

-- 1. Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Profiles (mirrors auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Memberships (joins users ↔ orgs with role)
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read and update only their own row
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Memberships: users can read their own memberships
CREATE POLICY "Users can read own memberships"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Organizations: users can read orgs they belong to
CREATE POLICY "Members can read their org"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = organizations.id
        AND memberships.user_id = auth.uid()
    )
  );

-- Organizations: only admins can update org name
CREATE POLICY "Admins can update org"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.org_id = organizations.id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'admin'
    )
  );

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RPC: bootstrap org + membership after signup
-- Called from the app after signup completes.
-- SECURITY DEFINER so it bypasses RLS (runs as DB owner).
-- auth.uid() still resolves to the calling user.
-- ============================================================

CREATE OR REPLACE FUNCTION public.bootstrap_org(org_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Reject unauthenticated calls
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent double-bootstrap: if user already has an org, return it
  SELECT m.org_id INTO new_org_id
  FROM public.memberships m
  WHERE m.user_id = auth.uid()
  LIMIT 1;

  IF new_org_id IS NOT NULL THEN
    RETURN json_build_object('org_id', new_org_id, 'already_exists', true);
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NULLIF(TRIM(org_name), ''), 'My Organization'))
  RETURNING id INTO new_org_id;

  -- Create admin membership
  INSERT INTO public.memberships (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'admin');

  RETURN json_build_object('org_id', new_org_id, 'already_exists', false);
END;
$$;

-- Restrict RPC execution to authenticated users only
REVOKE ALL ON FUNCTION public.bootstrap_org(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.bootstrap_org(text) TO authenticated;
