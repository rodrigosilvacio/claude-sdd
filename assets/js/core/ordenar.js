/**
 * Lógica pura da Atividade_Interativa de ordenar (R17.10). Sem acesso a DOM.
 * @param {string[]} ordem
 * @param {string[]} canonica
 */
export function verificar(ordem, canonica) {
  const certos = ordem.filter((id, i) => id === canonica[i]).length;
  return { correto: certos === canonica.length, certos, total: canonica.length };
}

/**
 * Troca o item i com o vizinho a delta posições; fora dos limites devolve cópia inalterada.
 * @param {string[]} ordem @param {number} i @param {number} delta
 */
export function mover(ordem, i, delta) {
  const j = i + delta;
  if (i < 0 || i >= ordem.length || j < 0 || j >= ordem.length) return ordem.slice();
  const nova = ordem.slice();
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}
