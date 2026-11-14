// Gerenciador_Progresso (Requisitos 6.3, 6.4, 8.5, 13.x, 19.x).
// Sem acesso direto a DOM nem a localStorage: o storage é injetado por função.
import { NOTA_APROVACAO } from '../../data/quizzes.js';

export const CHAVE = 'curso-sdd:progresso:v1';
const VERSAO = 1;

export const vazio = () => ({ licoes: new Set(), checklists: new Map(), quizzes: new Map() });

const ordenar = (iteravel) => [...iteravel].sort();
const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const ehListaTexto = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

/**
 * Converte o progresso em objeto JSON-friendly com chaves ordenadas.
 * @param {{licoes:Set<string>, checklists:Map<string,Set<string>>, quizzes:Map<string,{aprovado:boolean,melhorPct:number}>}} p
 */
export function serializar(p) {
  const checklists = {};
  for (const k of ordenar(p.checklists.keys())) checklists[k] = ordenar(p.checklists.get(k));
  const quizzes = {};
  for (const k of ordenar(p.quizzes.keys())) {
    const q = p.quizzes.get(k);
    quizzes[k] = { aprovado: q.aprovado, melhorPct: q.melhorPct };
  }
  return { versao: VERSAO, licoes: ordenar(p.licoes), checklists, quizzes };
}

/**
 * Lê o texto gravado. Nunca lança.
 * Texto ausente (null/undefined) => progresso vazio sem aviso.
 * Inválido => progresso vazio com aviso 'corrompido'.
 * @param {string|null|undefined} texto
 * @returns {{progresso: ReturnType<typeof vazio>, aviso: 'corrompido'|null}}
 */
export function desserializar(texto) {
  if (texto === null || texto === undefined) return { progresso: vazio(), aviso: null };
  const corrompido = { progresso: vazio(), aviso: 'corrompido' };
  try {
    if (typeof texto !== 'string') return corrompido;
    const o = JSON.parse(texto);
    if (!ehObjeto(o) || o.versao !== VERSAO) return corrompido;
    if (!ehListaTexto(o.licoes) || !ehObjeto(o.checklists) || !ehObjeto(o.quizzes)) return corrompido;
    const p = vazio();
    for (const id of o.licoes) p.licoes.add(id);
    for (const [k, itens] of Object.entries(o.checklists)) {
      if (!ehListaTexto(itens)) return corrompido;
      if (itens.length) p.checklists.set(k, new Set(itens));
    }
    for (const [k, q] of Object.entries(o.quizzes)) {
      if (!ehObjeto(q) || typeof q.aprovado !== 'boolean' || typeof q.melhorPct !== 'number' || !Number.isFinite(q.melhorPct)) {
        return corrompido;
      }
      p.quizzes.set(k, { aprovado: q.aprovado, melhorPct: q.melhorPct });
    }
    return { progresso: p, aviso: null };
  } catch {
    return corrompido;
  }
}

/**
 * @param {() => {getItem:Function,setItem:Function,removeItem:Function}} storageFn
 *   Função que devolve o storage; pode lançar (ex.: SecurityError).
 * @param {object} [catalogo] Reservado para as funções puras sobre o catálogo.
 */
export function criarGerenciador(storageFn, catalogo) { // eslint-disable-line no-unused-vars
  let memoria = vazio();
  let semArmazenamento = false;
  let aviso = null;
  const ouvintes = new Set();

  const obterStorage = () => {
    try {
      const s = storageFn();
      if (!s) throw new Error('sem storage');
      return s;
    } catch {
      semArmazenamento = true;
      return null;
    }
  };

  const carregar = () => {
    const s = obterStorage();
    if (!s) return;
    try {
      const { progresso, aviso: a } = desserializar(s.getItem(CHAVE));
      memoria = progresso;
      aviso = a;
    } catch {
      semArmazenamento = true;
    }
  };

  const gravar = () => {
    const s = obterStorage();
    if (!s) return;
    try {
      s.setItem(CHAVE, JSON.stringify(serializar(memoria)));
      aviso = null; // o valor inválido é sobrescrito apenas na gravação
    } catch {
      semArmazenamento = true;
    }
  };

  const notificar = () => {
    for (const cb of [...ouvintes]) {
      try { cb(memoria); } catch { /* um ouvinte com erro não afeta os demais */ }
    }
  };

  const alterou = () => { gravar(); notificar(); };

  carregar();

  // Mudanças feitas em outra aba. Opcional: ausente em Node.
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', (e) => {
      if (e && e.key !== null && e.key !== undefined && e.key !== CHAVE) return;
      carregar();
      notificar();
    });
  }

  return {
    estado: () => memoria,

    marcarLicao(id, feito = true) {
      if (feito) memoria.licoes.add(id); else memoria.licoes.delete(id);
      alterou();
    },

    licaoConcluida: (id) => memoria.licoes.has(id),

    /** @returns {() => void} função para cancelar a assinatura */
    assinar(callback) {
      ouvintes.add(callback);
      return () => { ouvintes.delete(callback); };
    },

    /** Alterna o item e devolve o novo estado (true = marcado). */
    alternarItem(ferramentaId, itemId) {
      let itens = memoria.checklists.get(ferramentaId);
      if (!itens) { itens = new Set(); memoria.checklists.set(ferramentaId, itens); }
      let marcado;
      if (itens.has(itemId)) { itens.delete(itemId); marcado = false; } else { itens.add(itemId); marcado = true; }
      if (itens.size === 0) memoria.checklists.delete(ferramentaId);
      alterou();
      return marcado;
    },

    /** Aprovação monotônica (OR); melhorPct é o máximo já obtido. */
    registrarQuiz(moduloId, pct) {
      if (typeof pct !== 'number' || !Number.isFinite(pct)) return memoria.quizzes.get(moduloId) ?? null;
      const ant = memoria.quizzes.get(moduloId);
      const atual = {
        aprovado: Boolean(ant && ant.aprovado) || pct >= NOTA_APROVACAO,
        melhorPct: ant ? Math.max(ant.melhorPct, pct) : pct,
      };
      memoria.quizzes.set(moduloId, atual);
      alterou();
      return atual;
    },

    reiniciar() {
      memoria = vazio();
      aviso = null;
      const s = obterStorage();
      if (s) {
        try { s.removeItem(CHAVE); } catch { semArmazenamento = true; }
      }
      notificar();
    },

    avisos: () => ({ semArmazenamento, corrompido: aviso === 'corrompido' }),
  };
}

// ---------------------------------------------------------------------------
// Funções puras sobre (progresso, catalogo) (Requisitos 2.5, 3.2, 6.5, 6.6, 14.2).
// Lição = item com tipo 'licao' ou 'tutorial'. Nenhuma altera o progresso.
// ---------------------------------------------------------------------------
const ehLicao = (item) => item.tipo === 'licao' || item.tipo === 'tutorial';
const idFerramenta = (item) => item.id.slice(item.id.indexOf(':') + 1);
const todosItens = (catalogo) => catalogo.modulos.flatMap((m) => m.itens);

/** Verdadeiro quando todos os itens do Checklist da ferramenta estão marcados (checklist vazio não conclui). */
export function exercicioConcluido(p, ferramentaId, catalogo) {
  const itens = (catalogo.checklists && catalogo.checklists[ferramentaId]) || [];
  if (itens.length === 0) return false;
  const marcados = p.checklists.get(ferramentaId);
  return Boolean(marcados) && itens.every((i) => marcados.has(i.id));
}

const itemConcluido = (p, item, catalogo) => {
  if (ehLicao(item)) return p.licoes.has(item.id);
  if (item.tipo === 'exercicio') return exercicioConcluido(p, idFerramenta(item), catalogo);
  if (item.tipo === 'quiz') {
    const q = p.quizzes.get(idFerramenta(item));
    return Boolean(q && q.aprovado);
  }
  return true; // tipo desconhecido não conta
};

const ehContavel = (item) => ehLicao(item) || item.tipo === 'exercicio' || item.tipo === 'quiz';

/** Inteiro de 0 a 100. */
export function percentual(p, catalogo) {
  const itens = todosItens(catalogo).filter(ehContavel);
  if (itens.length === 0) return 0;
  const feitos = itens.filter((i) => itemConcluido(p, i, catalogo)).length;
  return Math.round((feitos / itens.length) * 100);
}

/** Itens obrigatórios ainda não concluídos, na ordem do catálogo, cada um com id, titulo e url. */
export function pendencias(p, catalogo) {
  const r = { licoes: [], exercicios: [], quizzes: [] };
  for (const item of todosItens(catalogo)) {
    if (!ehContavel(item) || itemConcluido(p, item, catalogo)) continue;
    const entrada = { id: item.id, titulo: item.titulo, url: item.url };
    if (ehLicao(item)) r.licoes.push(entrada);
    else if (item.tipo === 'exercicio') r.exercicios.push(entrada);
    else r.quizzes.push(entrada);
  }
  return r;
}

export function conclusaoTotal(p, catalogo) {
  const { licoes, exercicios, quizzes } = pendencias(p, catalogo);
  return licoes.length === 0 && exercicios.length === 0 && quizzes.length === 0;
}

/** Primeira lição (na ordem do catálogo) ainda não concluída, ou null. */
export function proximaLicao(p, catalogo) {
  return todosItens(catalogo).find((i) => ehLicao(i) && !p.licoes.has(i.id)) ?? null;
}

/** Itens adjacentes no mesmo módulo; null nas extremidades ou se não encontrado. */
export function vizinhas(moduloId, itemId, catalogo) {
  const modulo = catalogo.modulos.find((m) => m.id === moduloId);
  const idx = modulo ? modulo.itens.findIndex((i) => i.id === itemId) : -1;
  if (idx < 0) return { anterior: null, proxima: null };
  return { anterior: modulo.itens[idx - 1] ?? null, proxima: modulo.itens[idx + 1] ?? null };
}
