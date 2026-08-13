import { supabase } from './supabase';

export const ORIGEM_IMPORTACAO_ORCAMENTOS_PREFIXO =
  'planilha_orcamentos_crm:';

export function montarOrigemImportacaoOrcamentos(
  arquivoNome: string,
  dataImportacao: string
) {
  const nomeNormalizado = arquivoNome.trim() || 'arquivo-sem-nome';

  return `${ORIGEM_IMPORTACAO_ORCAMENTOS_PREFIXO}${dataImportacao}:${nomeNormalizado}`;
}

export function montarSufixoCacheOrigemImportacao(
  origemImportacao: string | null
) {
  return origemImportacao || 'sem-lote-importacao';
}

export async function buscarOrigemImportacaoOrcamentosAtual() {
  const { data, error } = await supabase
    .from('orcamentos_historico')
    .select('origem_importacao, updated_at')
    .like('origem_importacao', `${ORIGEM_IMPORTACAO_ORCAMENTOS_PREFIXO}%`)
    .not('origem_importacao', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.origem_importacao || null;
}
