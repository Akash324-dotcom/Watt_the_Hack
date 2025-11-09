-- Fix function search path security issue
CREATE OR REPLACE FUNCTION get_circle_member_count(circle_uuid UUID)
RETURNS BIGINT 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::BIGINT FROM public.circle_members WHERE circle_id = circle_uuid;
$$;