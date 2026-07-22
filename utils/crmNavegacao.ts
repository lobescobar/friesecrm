import type { ClienteModalSecao } from '../components/crm/cliente-modal/ClienteModalNav';
import type {
  EstadoNavegacaoCRM,
  AtualizacaoParametros
} from '../types/crmNavegacao';

export const secoesCliente: ClienteModalSecao[] = [
  'dados',
  'contatos',
  'historico',
  'observacoes'
];

export const CHAVE_NAVEGACAO_CRM = 'friese-crm:navegacao-atual';

export const navegacaoInicialPadrao: EstadoNavegacaoCRM = {
  cliente: null,
  aba: 'dados',
  orcamento: null
};

export function normalizarSecaoCliente(valor: string | null): ClienteModalSecao {
  if (secoesCliente.includes(valor as ClienteModalSecao)) {
    return valor as ClienteModalSecao;
  }

  return 'dados';
}

export function normalizarNavegacao(
  navegacao: Partial<EstadoNavegacaoCRM> | null | undefined
): EstadoNavegacaoCRM {
  return {
    cliente: navegacao?.cliente || null,
    aba: normalizarSecaoCliente(navegacao?.aba || null),
    orcamento: navegacao?.orcamento || null
  };
}

export function lerNavegacaoDaUrl(): EstadoNavegacaoCRM {
  if (typeof window === 'undefined') {
    return navegacaoInicialPadrao;
  }

  const parametros = new URLSearchParams(window.location.search);

  return normalizarNavegacao({
    cliente: parametros.get('cliente'),
    aba: normalizarSecaoCliente(parametros.get('aba')),
    orcamento: parametros.get('orcamento')
  });
}

export function lerNavegacaoSalva(): EstadoNavegacaoCRM {
  if (typeof window === 'undefined') {
    return navegacaoInicialPadrao;
  }

  try {
    const valorSalvo = window.sessionStorage.getItem(CHAVE_NAVEGACAO_CRM);

    if (!valorSalvo) {
      return navegacaoInicialPadrao;
    }

    const dados = JSON.parse(valorSalvo) as Partial<EstadoNavegacaoCRM>;
    return normalizarNavegacao(dados);
  } catch (erro) {
    console.warn('Não foi possível ler navegação salva do CRM:', erro);
    return navegacaoInicialPadrao;
  }
}

export function salvarNavegacao(navegacao: EstadoNavegacaoCRM) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!navegacao.cliente) {
    window.sessionStorage.removeItem(CHAVE_NAVEGACAO_CRM);
    return;
  }

  window.sessionStorage.setItem(CHAVE_NAVEGACAO_CRM, JSON.stringify(navegacao));
}

export function limparNavegacaoSalva() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(CHAVE_NAVEGACAO_CRM);
}

export function temParametrosDeNavegacaoNaUrl() {
  if (typeof window === 'undefined') {
    return false;
  }

  const parametros = new URLSearchParams(window.location.search);

  return (
    parametros.has('cliente') ||
    parametros.has('aba') ||
    parametros.has('orcamento')
  );
}

export function lerNavegacaoInicial(): EstadoNavegacaoCRM {
  if (typeof window === 'undefined') {
    return navegacaoInicialPadrao;
  }

  const navegacaoUrl = lerNavegacaoDaUrl();

  if (navegacaoUrl.cliente || temParametrosDeNavegacaoNaUrl()) {
    return navegacaoUrl;
  }

  const navegacaoSalva = lerNavegacaoSalva();

  if (navegacaoSalva.cliente) {
    return navegacaoSalva;
  }

  return navegacaoInicialPadrao;
}

export function escreverNavegacaoNaUrl(navegacao: EstadoNavegacaoCRM) {
  if (typeof window === 'undefined') {
    return;
  }

  const parametrosAtuais = new URLSearchParams(window.location.search);

  if (navegacao.cliente) {
    parametrosAtuais.set('cliente', navegacao.cliente);
    parametrosAtuais.set('aba', navegacao.aba);

    if (navegacao.orcamento) {
      parametrosAtuais.set('orcamento', navegacao.orcamento);
    } else {
      parametrosAtuais.delete('orcamento');
    }
  } else {
    parametrosAtuais.delete('cliente');
    parametrosAtuais.delete('aba');
    parametrosAtuais.delete('orcamento');
  }

  const query = parametrosAtuais.toString();
  const destino = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  const atual = `${window.location.pathname}${window.location.search}`;

  if (destino !== atual) {
    window.history.replaceState(null, '', destino);
  }
}

export function navegacoesIguais(
  atual: EstadoNavegacaoCRM,
  proxima: EstadoNavegacaoCRM
) {
  return (
    atual.cliente === proxima.cliente &&
    atual.aba === proxima.aba &&
    atual.orcamento === proxima.orcamento
  );
}

export function montarProximaNavegacao(
  atualizacoes: AtualizacaoParametros
): EstadoNavegacaoCRM {
  const navegacaoAtual = lerNavegacaoDaUrl();

  return normalizarNavegacao({
    cliente:
      atualizacoes.cliente !== undefined
        ? atualizacoes.cliente
        : navegacaoAtual.cliente,
    aba:
      atualizacoes.aba !== undefined
        ? atualizacoes.aba || 'dados'
        : navegacaoAtual.aba,
    orcamento:
      atualizacoes.orcamento !== undefined
        ? atualizacoes.orcamento
        : navegacaoAtual.orcamento
  });
}
