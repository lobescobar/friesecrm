-- Etapa 8 — normalizar segmentos de clientes e alçadas de usuários
-- Regra definida:
-- Coluna EK da planilha de cadastro de clientes é a origem do campo segmento.
-- Valores oficiais:
--   Agroindustria
--   Corrugados
--   Tempera Indutiva
--   Tratamento Termico
-- Vazios e valores fora do padrão devem ser desconsiderados.

-- 1) Conferência antes da correção
select
  coalesce(nullif(trim(segmento), ''), '(vazio)') as segmento_atual,
  count(*) as total
from public.clientes
group by 1
order by 2 desc, 1;

-- 2) Normaliza segmentos dos clientes.
-- Atenção: valores fora dos 4 segmentos oficiais serão definidos como null.
update public.clientes
set segmento =
  case
    when segmento is null or trim(segmento) = '' then null

    when lower(trim(segmento)) in (
      'agroindustria',
      'agroindústria',
      'agro industria',
      'agro indústria',
      'agro-industria',
      'agro-indústria'
    ) then 'Agroindustria'

    when lower(trim(segmento)) in (
      'corrugados',
      'corrugado'
    ) then 'Corrugados'

    when lower(trim(segmento)) in (
      'tempera indutiva',
      'têmpera indutiva',
      'tempera-indutiva',
      'têmpera-indutiva'
    ) then 'Tempera Indutiva'

    when lower(trim(segmento)) in (
      'tratamento termico',
      'tratamento térmico',
      'tratamento-termico',
      'tratamento-térmico'
    ) then 'Tratamento Termico'

    else null
  end;

-- 3) Normaliza também as alçadas já gravadas nos usuários.
-- Isso evita que vendedor com permissão antiga, como AGROINDUSTRIA,
-- deixe de enxergar clientes após a padronização.
update public.profiles p
set segmentos_permitidos = coalesce(
  (
    select array_agg(distinct segmento_normalizado order by segmento_normalizado)
    from (
      select
        case
          when valor is null or trim(valor) = '' then null

          when lower(trim(valor)) in (
            'agroindustria',
            'agroindústria',
            'agro industria',
            'agro indústria',
            'agro-industria',
            'agro-indústria'
          ) then 'Agroindustria'

          when lower(trim(valor)) in (
            'corrugados',
            'corrugado'
          ) then 'Corrugados'

          when lower(trim(valor)) in (
            'tempera indutiva',
            'têmpera indutiva',
            'tempera-indutiva',
            'têmpera-indutiva'
          ) then 'Tempera Indutiva'

          when lower(trim(valor)) in (
            'tratamento termico',
            'tratamento térmico',
            'tratamento-termico',
            'tratamento-térmico'
          ) then 'Tratamento Termico'

          else null
        end as segmento_normalizado
      from unnest(coalesce(p.segmentos_permitidos, array[]::text[])) as u(valor)
    ) normalizados
    where segmento_normalizado is not null
  ),
  array[]::text[]
);

-- 4) Conferência depois da correção
select
  coalesce(nullif(trim(segmento), ''), '(vazio)') as segmento_corrigido,
  count(*) as total
from public.clientes
group by 1
order by 2 desc, 1;
