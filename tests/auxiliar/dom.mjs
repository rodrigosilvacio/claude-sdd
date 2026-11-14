// Auxiliares de teste da UI: DOM com linkedom, armazenamento em memória e anúncios capturados.
import { parseHTML } from 'linkedom';
import { criarGerenciador } from '../../assets/js/core/progresso.js';

export function criarDom(corpo = '') {
  const { window, document } = parseHTML(`<!doctype html><html lang="pt-BR"><head></head><body>${corpo}</body></html>`);
  return { window, document };
}

export const armazenamentoMemoria = () => {
  const dados = new Map();
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
  };
};

export const gerenciadorMemoria = () => {
  const s = armazenamentoMemoria();
  return criarGerenciador(() => s);
};

export const gerenciadorSemStorage = () => criarGerenciador(() => { throw new Error('indisponível'); });

export const capturaAnuncios = () => {
  const lista = [];
  const anunciar = (t) => { lista.push(t); };
  anunciar.lista = lista;
  return anunciar;
};

export function disparar(window, alvo, tipo, extra = {}) {
  const ev = new window.Event(tipo, { bubbles: true, cancelable: true });
  Object.assign(ev, extra);
  alvo.dispatchEvent(ev);
  return ev;
}

export const marcar = (window, caixa, valor = true) => {
  caixa.checked = valor;
  disparar(window, caixa, 'change');
};

/** Conclui todo o catálogo no gerenciador (lições, checklists e quizzes). */
export function concluirTudo(g, catalogo) {
  for (const m of catalogo.modulos) {
    for (const item of m.itens) {
      const id = item.id.slice(item.id.indexOf(':') + 1);
      if (item.tipo === 'licao' || item.tipo === 'tutorial') g.marcarLicao(item.id, true);
      else if (item.tipo === 'exercicio') for (const c of catalogo.checklists[id] ?? []) g.alternarItem(id, c.id);
      else if (item.tipo === 'quiz') g.registrarQuiz(id, 100);
    }
  }
}
