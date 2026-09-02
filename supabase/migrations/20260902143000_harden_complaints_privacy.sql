-- Harden public access: citizens can only read non-sensitive fields.
-- Contact details remain in the table for staff, but are never exposed via anon SELECT.

DROP POLICY IF EXISTS "Anyone can look up a complaint by reference code" ON public.complaints;

CREATE OR REPLACE VIEW public.complaints_public
WITH (security_invoker = true)
AS
SELECT
  id,
  reference_code,
  title,
  category,
  description,
  location,
  ward,
  status,
  admin_notes,
  created_at,
  updated_at
FROM public.complaints;

GRANT SELECT ON public.complaints_public TO anon, authenticated;

REVOKE SELECT ON public.complaints FROM anon;
GRANT SELECT ON public.complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;

CREATE POLICY "Staff can read all complaints"
  ON public.complaints
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON VIEW public.complaints_public IS
  'Public-safe complaint data. Excludes contact_name, contact_email, contact_phone.';
