
DROP POLICY IF EXISTS "Anyone can create a lead" ON public.leads;

CREATE POLICY "Anyone can create a lead"
ON public.leads FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 120
  AND char_length(email) BETWEEN 5 AND 255
  AND char_length(whatsapp) BETWEEN 8 AND 40
  AND char_length(reason) BETWEEN 2 AND 60
);
