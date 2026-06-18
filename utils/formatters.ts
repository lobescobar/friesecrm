export function somenteNumeros(valor?: string | null) {
  return String(valor ?? '').replace(/\D/g, '');
}

export function normalizarTexto(valor?: string | null) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function formatarCnpj(valor?: string | null) {
  const numeros = somenteNumeros(valor);
  if (numeros.length !== 14) return valor || '-';

  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function formatarTelefone(valor?: string | null) {
  const numeros = somenteNumeros(valor);

  if (numeros.length === 11) {
    return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }

  if (numeros.length === 10) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  return valor || '';
}

export function montarLinkWhatsapp(telefone?: string | null) {
  const numeros = somenteNumeros(telefone);

  if (numeros.length < 10) return '';

  const comPais = numeros.startsWith('55') ? numeros : `55${numeros}`;
  return `https://wa.me/${comPais}`;
}

export function montarEnderecoCompleto(partes: {
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
}) {
  return [partes.endereco, partes.cidade, partes.estado]
    .filter(Boolean)
    .join(', ');
}
