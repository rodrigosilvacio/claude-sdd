/**
 * Estado puro do Stepper (R17.11). Sem acesso a DOM.
 * @param {{atual:number,total:number}} s
 * @param {'proximo'|'anterior'} acao
 */
export function mover(s, acao) {
  const atual = acao === 'proximo' ? Math.min(s.atual + 1, s.total)
                                   : Math.max(s.atual - 1, 1);
  return { atual, total: s.total };
}

/** @param {{atual:number,total:number}} s */
export const rotulo = (s) => `passo ${s.atual} de ${s.total}`;
