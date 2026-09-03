-- Allow status + notes updates from the public staff panel (password-gated in the app).

DROP POLICY IF EXISTS "Staff panel can update status" ON public.complaints;

CREATE POLICY "Staff panel can update status"
  ON public.complaints
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.complaints TO anon;
