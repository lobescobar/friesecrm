ALTER TABLE public.orcamentos_interacoes
  ADD COLUMN IF NOT EXISTS lembrete_previo_enviado_em timestamptz NULL;

ALTER TABLE public.orcamentos_interacoes
  ADD COLUMN IF NOT EXISTS lembrete_data_enviado_em timestamptz NULL;

COMMENT ON COLUMN public.orcamentos_interacoes.lembrete_previo_enviado_em
  IS 'Data/hora em que o lembrete de um dia antes foi enviado ao responsável.';

COMMENT ON COLUMN public.orcamentos_interacoes.lembrete_data_enviado_em
  IS 'Data/hora em que o lembrete da data limite foi enviado ao responsável.';

CREATE INDEX IF NOT EXISTS idx_orcamentos_interacoes_lembretes_pendentes
  ON public.orcamentos_interacoes (
    data_retorno,
    lembrete_previo_enviado_em,
    lembrete_data_enviado_em
  )
  WHERE data_retorno IS NOT NULL
    AND proximo_passo IS NOT NULL;
