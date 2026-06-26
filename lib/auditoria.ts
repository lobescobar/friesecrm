import { supabase } from './supabase';

type TabelaImportacaoAuditada = 'clientes' | 'orcamentos_historico';
type AcaoImportacaoAuditada = 'importacao_erp' | 'importacao_orcamentos';

type RegistrarAuditoriaImportacaoParams = {
  tabela: TabelaImportacaoAuditada;
  acao: AcaoImportacaoAuditada;
  arquivoNome: string;
  resultado: Record<string, unknown>;
};

export async function registrarAuditoriaImportacao({
  tabela,
  acao,
  arquivoNome,
  resultado
}: RegistrarAuditoriaImportacaoParams) {
  const { error } = await supabase.rpc('crm_registrar_auditoria_importacao', {
    p_tabela: tabela,
    p_acao: acao,
    p_arquivo_nome: arquivoNome,
    p_resultado: resultado
  });

  if (error) {
    console.warn('Não foi possível registrar auditoria da importação:', error.message);
    return false;
  }

  return true;
}
