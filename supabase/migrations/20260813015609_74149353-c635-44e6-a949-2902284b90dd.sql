CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  product text NOT NULL DEFAULT 'minicurso',
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL DEFAULT 0,
  external_reference text,
  mercadopago_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_purchases_email ON public.purchases (lower(email));
CREATE INDEX idx_purchases_external_reference ON public.purchases (external_reference);

CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admins manage minicurso files"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'minicurso' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'minicurso' AND public.has_role(auth.uid(), 'admin'::app_role));