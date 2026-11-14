// Formatação de datas e números no padrão pt-BR (Requisito 10.3).
// Módulo puro: sem acesso a DOM, localStorage ou rede.

const pad = (n, t = 2) => String(n).padStart(t, '0');

/**
 * Formata uma data como 'dd/mm/aaaa' (calendário local).
 * @param {Date} d
 * @returns {string}
 */
export function formatarData(d) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear(), 4)}`;
}

/**
 * Lê uma string estritamente no formato 'dd/mm/aaaa'.
 * Devolve null quando o formato ou a data (calendário real) é inválido.
 * @param {string} s
 * @returns {Date|null}
 */
export function lerData(s) {
  if (typeof s !== 'string') return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  if (ano < 1) return null;
  const d = new Date(2000, 0, 1);
  d.setFullYear(ano, mes - 1, dia); // evita o mapeamento de anos 0-99 para 1900-1999
  d.setHours(0, 0, 0, 0);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return d;
}

/**
 * Formata um número com vírgula decimal e `casas` casas decimais.
 * @param {number} n
 * @param {number} [casas=1]
 * @returns {string}
 */
export function formatarNumero(n, casas = 1) {
  const texto = n.toFixed(casas);
  // Evita "-0,0" quando o valor arredonda para zero.
  const semSinalNulo = /^-0(\.0*)?$/.test(texto) ? texto.slice(1) : texto;
  return semSinalNulo.replace('.', ',');
}
