DROP INDEX IF EXISTS public.idx_orcamentos_interacoes_data_retorno;
DROP INDEX IF EXISTS public.idx_orcamentos_interacoes_lembretes_pendentes;

ALTER TABLE public.orcamentos_interacoes
  ALTER COLUMN data_retorno TYPE timestamptz
  USING (
    (data_retorno::timestamp + interval '9 hours')
    AT TIME ZONE 'America/Sao_Paulo'
  );

ALTER TABLE public.orcamentos_interacoes
  ADD COLUMN IF NOT EXISTS lembrete_processando_em timestamptz NULL,
  ADD COLUMN IF NOT EXISTS lembrete_enviado_em timestamptz NULL;

COMMENT ON COLUMN public.orcamentos_interacoes.data_retorno
  IS 'Data e hora limite da ação pendente, armazenadas como instante absoluto.';

COMMENT ON COLUMN public.orcamentos_interacoes.lembrete_processando_em
  IS 'Instante em que uma execução reservou o lembrete para envio.';

COMMENT ON COLUMN public.orcamentos_interacoes.lembrete_enviado_em
  IS 'Instante em que o alerta único foi enviado ao vendedor da carteira.';

CREATE INDEX idx_orcamentos_interacoes_lembretes_pendentes
  ON public.orcamentos_interacoes (data_retorno)
  WHERE data_retorno IS NOT NULL
    AND proximo_passo IS NOT NULL
    AND lembrete_enviado_em IS NULL;

CREATE OR REPLACE FUNCTION public.crm_claim_lembretes_acoes(
  p_agora timestamptz,
  p_ate timestamptz,
  p_limite integer DEFAULT 100
)
RETURNS SETOF public.orcamentos_interacoes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidatas AS (
    SELECT oi.id
    FROM public.orcamentos_interacoes AS oi
    WHERE oi.data_retorno > p_agora
      AND oi.data_retorno <= p_ate
      AND oi.proximo_passo IS NOT NULL
      AND btrim(oi.proximo_passo) <> ''
      AND oi.lembrete_enviado_em IS NULL
      AND (
        oi.lembrete_processando_em IS NULL
        OR oi.lembrete_processando_em < p_agora - interval '15 minutes'
      )
    ORDER BY oi.data_retorno ASC
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limite, 100), 500))
  ), reservadas AS (
    UPDATE public.orcamentos_interacoes AS oi
    SET lembrete_processando_em = p_agora
    FROM candidatas
    WHERE oi.id = candidatas.id
    RETURNING oi.*
  )
  SELECT * FROM reservadas;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_claim_lembretes_acoes(
  timestamptz,
  timestamptz,
  integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.crm_claim_lembretes_acoes(
  timestamptz,
  timestamptz,
  integer
) TO service_role;
