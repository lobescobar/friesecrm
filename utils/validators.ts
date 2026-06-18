import { somenteNumeros } from './formatters';

export function emailValido(email?: string | null) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function telefoneValido(telefone?: string | null) {
  if (!telefone) return true;
  const numeros = somenteNumeros(telefone);
  return numeros.length >= 10 && numeros.length <= 13;
}

export function valorLista(valor: string) {
  return valor.trim().replace(/\s+/g, ' ');
}
