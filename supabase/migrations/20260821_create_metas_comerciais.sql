-- Metas comerciais manuais usadas no Funil Comercial.
-- Regra:
-- - meta = valor imputado manualmente por vendedor, ano e mes;
-- - vendedor_email vincula a meta ao usuario em public.profiles.email;
-- - realizado = soma dos orcamentos fechados por estado da alcada do vendedor.

CREATE TABLE IF NOT EXISTS public.metas_comerciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_email text NOT NULL,
  ano integer NOT NULL,
  mes integer NOT NULL,
  valor_meta numeric(14, 2) NOT NULL DEFAULT 0,
  criado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  atualizado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT metas_comerciais_ano_check
    CHECK (ano BETWEEN 2000 AND 2100),
  CONSTRAINT metas_comerciais_mes_check
    CHECK (mes BETWEEN 1 AND 12),
  CONSTRAINT metas_comerciais_valor_meta_check
    CHECK (valor_meta >= 0),
  CONSTRAINT metas_comerciais_email_normalizado_check
    CHECK (vendedor_email = lower(trim(vendedor_email)))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_metas_comerciais_vendedor_periodo
  ON public.metas_comerciais (vendedor_email, ano, mes);

CREATE INDEX IF NOT EXISTS idx_metas_comerciais_periodo
  ON public.metas_comerciais (ano, mes);

CREATE INDEX IF NOT EXISTS idx_metas_comerciais_vendedor
  ON public.metas_comerciais (vendedor_email);

COMMENT ON TABLE public.metas_comerciais IS
  'Metas comerciais manuais por vendedor, ano e mes para comparacao meta x realizado no funil.';

COMMENT ON COLUMN public.metas_comerciais.vendedor_email IS
  'E-mail normalizado do vendedor em public.profiles.email.';

COMMENT ON COLUMN public.metas_comerciais.valor_meta IS
  'Valor manual da meta de vendas fechadas para o periodo.';

CREATE OR REPLACE FUNCTION public.crm_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_touch_updated_at() FROM public;

DROP TRIGGER IF EXISTS trg_metas_comerciais_updated_at
ON public.metas_comerciais;

CREATE TRIGGER trg_metas_comerciais_updated_at
BEFORE UPDATE ON public.metas_comerciais
FOR EACH ROW
EXECUTE FUNCTION public.crm_touch_updated_at();

ALTER TABLE public.metas_comerciais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas_comerciais_select_own_or_admin"
ON public.metas_comerciais;

DROP POLICY IF EXISTS "metas_comerciais_insert_admin"
ON public.metas_comerciais;

DROP POLICY IF EXISTS "metas_comerciais_update_admin"
ON public.metas_comerciais;

DROP POLICY IF EXISTS "metas_comerciais_delete_admin"
ON public.metas_comerciais;

CREATE POLICY "metas_comerciais_select_own_or_admin"
ON public.metas_comerciais
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR vendedor_email = (
    SELECT lower(p.email)
    FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "metas_comerciais_insert_admin"
ON public.metas_comerciais
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
);

CREATE POLICY "metas_comerciais_update_admin"
ON public.metas_comerciais
FOR UPDATE
TO authenticated
USING (
  public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
);

CREATE POLICY "metas_comerciais_delete_admin"
ON public.metas_comerciais
FOR DELETE
TO authenticated
USING (
  public.is_admin(auth.uid())
);

REVOKE ALL ON public.metas_comerciais FROM anon;
REVOKE ALL ON public.metas_comerciais FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_comerciais TO authenticated;
