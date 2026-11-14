// Gerador_Certificado (Requisito 14). Módulo puro: sem DOM, sem storage, sem rede.
import { formatarData } from './formato.js';
import { conclusaoTotal, pendencias, percentual } from './progresso.js';

export const NOME_MIN = 3;
export const NOME_MAX = 80;
export const TITULO_CURSO = 'Curso de Spec-Driven Development';
export const DECLARACAO = 'Certificado de participação autodeclarado, sem verificação de autenticidade';

// Letras Unicode, marcas, espaço, apóstrofo, hífen e ponto; deve iniciar com letra.
const PADRAO = /^[\p{L}\p{M}][\p{L}\p{M} '’.\-]*$/u;

/**
 * Valida o nome (R14.5 a R14.7). Aplica trim e normalização NFC; qualquer
 * caractere de controle, espaço não comum ou de largura zero é rejeitado
 * pelo padrão de caracteres permitidos. Nunca lança.
 * @param {unknown} bruto
 * @returns {{ok:true, nome:string}|{ok:false, erro:string}}
 */
export function validarNome(bruto) {
  const nome = String(bruto ?? '').trim().normalize('NFC');
  const tamanho = [...nome].length;
  if (tamanho === 0) return { ok: false, erro: 'Informe o seu nome.' };
  if (tamanho < NOME_MIN) return { ok: false, erro: 'O nome deve ter pelo menos 3 caracteres.' };
  if (tamanho > NOME_MAX) return { ok: false, erro: 'O nome deve ter no máximo 80 caracteres.' };
  if (!PADRAO.test(nome)) return { ok: false, erro: 'Use apenas letras, espaços, apóstrofo, hífen e ponto.' };
  return { ok: true, nome };
}

/** Escapa & < > " ' (R14.8). */
export function escaparHTML(s) {
  const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s ?? '').replace(/[&<>"']/g, (c) => mapa[c]);
}

/** Modelo puro do certificado (R14.10, R14.11); a UI preenche o DOM com textContent. */
export function montarCertificado({ nome, hoje, cargaHoraria, titulo = TITULO_CURSO }) {
  return { nome, titulo, data: formatarData(hoje), cargaHoraria, declaracao: DECLARACAO };
}

/**
 * Emite o certificado a partir do progresso lido no momento da chamada (R14.18).
 * Sem Conclusão_Total devolve as pendências; nome inválido devolve a mensagem.
 */
export function emitir({ entrada, lerProgresso, catalogo, hoje }) {
  const p = lerProgresso();
  if (!conclusaoTotal(p, catalogo)) {
    return { ok: false, erro: 'conclusao', pendencias: pendencias(p, catalogo), percentual: percentual(p, catalogo) };
  }
  const v = validarNome(entrada);
  if (!v.ok) return { ok: false, erro: 'nome', mensagem: v.erro };
  return {
    ok: true,
    modelo: montarCertificado({ nome: v.nome, hoje, cargaHoraria: catalogo.cargaHorariaHoras, titulo: TITULO_CURSO }),
  };
}
