-- ============================================================
-- RPC: get_user_org - bypasses RLS to retrieve user's org info
-- Fixes infinite recursion between memberships and organizations RLS policies
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_org()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_role text;
  v_org_name text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT m.org_id, m.role INTO v_org_id, v_role
  FROM public.memberships m
  WHERE m.user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN json_build_object('error', 'No membership found');
  END IF;

  SELECT o.name INTO v_org_name
  FROM public.organizations o
  WHERE o.id = v_org_id;

  IF v_org_name IS NULL THEN
    RETURN json_build_object('error', 'Organization not found');
  END IF;

  RETURN json_build_object(
    'org_id', v_org_id,
    'org_name', v_org_name,
    'role', v_role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_org() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_org() TO authenticated;

-- ============================================================
-- Also re-create bootstrap_org if it doesn't exist
-- (idempotent - uses CREATE OR REPLACE)
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT m.org_id INTO new_org_id
  FROM public.memberships m
  WHERE m.user_id = auth.uid()
  LIMIT 1;

  IF new_org_id IS NOT NULL THEN
    RETURN json_build_object('org_id', new_org_id, 'already_exists', true);
  END IF;

  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NULLIF(TRIM(org_name), ''), 'My Organization'))
  RETURNING id INTO new_org_id;

  INSERT INTO public.memberships (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'admin');

  RETURN json_build_object('org_id', new_org_id, 'already_exists', false);
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_org(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.bootstrap_org(text) TO authenticated;
