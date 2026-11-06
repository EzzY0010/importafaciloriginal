-- Atualiza somente a apresentação pública dos planos.
-- Não altera ofertas, valores ou links de checkout da CN Pay.
UPDATE public.site_settings
SET
  content = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            content,
            '{beginners_price}',
            to_jsonb('37,00'::text),
            true
          ),
          '{beginners_previous_price}',
          to_jsonb('150,00'::text),
          true
        ),
        '{beginners_period}',
        to_jsonb('/mês · cobrança recorrente'::text),
        true
      ),
      '{elite_price}',
      to_jsonb('297,00'::text),
      true
    ),
    '{elite_previous_price}',
    to_jsonb('497,00'::text),
    true
  )
  || jsonb_build_object(
    'usa_price', '57,00',
    'usa_period', '/mês · cobrança recorrente'
  ),
  updated_at = now()
WHERE id = 'global';
