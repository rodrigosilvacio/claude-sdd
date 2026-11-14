// Região única aria-live="polite" por página (Requisitos 11.9, 18.7).
const ID = 'anuncios';

/** Devolve a região única de anúncios, criando-a se ainda não existir. */
export function regiaoAnuncios(doc = globalThis.document) {
  if (!doc) return null;
  let regiao = doc.getElementById(ID);
  if (!regiao) {
    regiao = doc.createElement('div');
    regiao.id = ID;
    regiao.className = 'visualmente-oculto';
    regiao.setAttribute('aria-live', 'polite');
    regiao.setAttribute('aria-atomic', 'true');
    (doc.body || doc.documentElement).appendChild(regiao);
  }
  return regiao;
}

/**
 * Anuncia um texto para leitores de tela. Limpa a região antes de escrever,
 * para que a repetição do mesmo texto também seja anunciada.
 * @param {string} texto
 */
export function anunciar(texto, doc = globalThis.document) {
  const regiao = regiaoAnuncios(doc);
  if (!regiao) return;
  regiao.textContent = '';
  regiao.textContent = String(texto ?? '');
}
