#!/usr/bin/env node
// Verificador de conteúdo do Curso_SDD (tarefa 13.2).
// Todas as funções de análise são exportadas e devolvem listas de mensagens de erro (strings);
// lista vazia significa que a verificação passou. A CLI só roda quando o arquivo é executado
// diretamente: `node tools/verificar-conteudo.mjs [--estrito]`.
//
// Convenções assumidas nas páginas (documentadas aqui para os autores):
//  - Comandos de tutorial ficam em elementos com `data-comando` ou classe `comando`
//    (uma linha = um comando; linhas vazias e iniciadas por `#` são ignoradas). Entradas de
//    `comandosPermitidos` com `<placeholder>` aceitam qualquer texto no lugar.
//  - Página de Lição = item do catálogo com tipo `licao` ou `tutorial`. Exercício, quiz,
//    índice de módulo e páginas fora do catálogo não exigem Botão_Concluir.
//  - Sem nenhuma página de Lição no disco, o script apenas avisa (exit 0); com `--estrito` falha.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseHTML } from 'linkedom';

export const LIMITE_PALAVRAS = 150;
export const LIMITE_TRANSICAO_MS = 600;
export const LIMITE_LACO_MS = 5000;
export const CONTRASTE_TEXTO = 4.5;
export const CONTRASTE_NAO_TEXTO = 3;

/** Pares de tokens verificados: [primeiro plano, fundo, mínimo]. */
export const PARES_CONTRASTE = [
  ['--cor-texto', '--cor-fundo', CONTRASTE_TEXTO],
  ['--cor-texto', '--cor-superficie', CONTRASTE_TEXTO],
  ['--cor-texto-suave', '--cor-fundo', CONTRASTE_TEXTO],
  ['--cor-texto-suave', '--cor-superficie', CONTRASTE_TEXTO],
  ['--cor-link', '--cor-fundo', CONTRASTE_TEXTO],
  ['--cor-link', '--cor-superficie', CONTRASTE_TEXTO],
  ['--cor-texto-destaque', '--cor-destaque', CONTRASTE_TEXTO],
  ['--cor-foco', '--cor-fundo', CONTRASTE_NAO_TEXTO],
  ['--cor-borda', '--cor-fundo', CONTRASTE_NAO_TEXTO],
  ['--cor-destaque', '--cor-fundo', CONTRASTE_NAO_TEXTO],
];

const SEL_VISUAL =
  '.visual, .diagrama, .linha-tempo, .stepper, .mockup, .cartao, .atividade, table, svg, ' +
  '[data-componente="stepper"], [data-componente="ordenar"], [data-componente="comparador"]';
const IGNORADOS = new Set(['script', 'style', 'nav', 'header', 'footer', 'template', 'noscript', 'head']);
const TEXTO = new Set(['p', 'ul', 'ol', 'dl', 'blockquote', 'pre']);

export const parsear = (html) => parseHTML(html).document;
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
export const contarPalavras = (texto) => norm(texto).split(' ').filter(Boolean).length;
const temClasse = (el, c) => (el.getAttribute('class') || '').split(/\s+/).includes(c);

// ---------- Idioma (R10.1) ----------
export function verificarLang(doc) {
  const lang = doc.documentElement?.getAttribute('lang');
  return lang === 'pt-BR' ? [] : [`<html> deve ter lang="pt-BR" (encontrado: ${lang ?? 'ausente'})`];
}

// ---------- Elemento_Visual por lição (R17.1) ----------
export function verificarElementoVisual(doc) {
  const raiz = doc.querySelector('main') || doc.body;
  return raiz && raiz.querySelector(SEL_VISUAL) ? [] : ['a Lição não tem nenhum Elemento_Visual'];
}

// ---------- Bloco_Texto (R17.2) ----------
const ehVisual = (el) => el.matches(SEL_VISUAL) || !!el.querySelector(SEL_VISUAL);

function sequencia(el, saida) {
  for (const filho of el.children) {
    const tag = filho.tagName.toLowerCase();
    if (IGNORADOS.has(tag) || temClasse(filho, 'concluir')) continue;
    if (/^h[1-6]$/.test(tag)) saida.push({ tipo: 'titulo' });
    else if (ehVisual(filho)) saida.push({ tipo: 'visual' });
    else if (TEXTO.has(tag)) saida.push({ tipo: 'texto', palavras: contarPalavras(filho.textContent), trecho: norm(filho.textContent).slice(0, 40) });
    else if (filho.children.length) sequencia(filho, saida);
    else if (norm(filho.textContent)) saida.push({ tipo: 'texto', palavras: contarPalavras(filho.textContent), trecho: norm(filho.textContent).slice(0, 40) });
  }
  return saida;
}

export function verificarBlocosTexto(doc, limite = LIMITE_PALAVRAS) {
  const raiz = doc.querySelector('main') || doc.body;
  if (!raiz) return [];
  const erros = [];
  let total = 0, trecho = '';
  const fechar = () => {
    if (total > limite) erros.push(`Bloco_Texto com ${total} palavras (máximo ${limite}) perto de "${trecho}…"`);
    total = 0; trecho = '';
  };
  for (const item of sequencia(raiz, [])) {
    if (item.tipo === 'texto') { if (!total) trecho = item.trecho; total += item.palavras; }
    else fechar();
  }
  fechar();
  return erros;
}

// ---------- SVG acessível (R18.2) ----------
export function verificarSvgs(doc) {
  const erros = [];
  [...doc.querySelectorAll('svg')].forEach((svg, i) => {
    if (svg.getAttribute('aria-hidden') === 'true') return;
    const nome = `svg #${i + 1}`;
    if (svg.getAttribute('role') !== 'img') return erros.push(`${nome}: falta role="img" (ou aria-hidden="true")`);
    const ids = (svg.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    const rotulado = ids.length > 0 && ids.every((id) => doc.getElementById(id) && norm(doc.getElementById(id).textContent));
    const titulo = [...svg.children].some((c) => c.tagName.toLowerCase() === 'title' && norm(c.textContent));
    if (!rotulado && !titulo && !norm(svg.getAttribute('aria-label'))) erros.push(`${nome}: falta nome acessível (<title>, aria-labelledby ou aria-label)`);
  });
  return erros;
}

// ---------- <ol> equivalente em .diagrama e .linha-tempo (R18.3) ----------
const textoDe = (li) => norm(li.textContent).toLowerCase();

function verificarOl(el, nome, ciclo) {
  const ol = el.tagName.toLowerCase() === 'ol' ? el : el.querySelector('ol');
  if (!ol) return [`${nome}: falta lista ordenada <ol> equivalente`];
  const itens = [...ol.children].filter((c) => c.tagName.toLowerCase() === 'li');
  if (!itens.length) return [`${nome}: a lista ordenada está vazia`];
  const erros = [];
  if (el.tagName.toLowerCase() !== 'ol') {
    const etapas = el.querySelectorAll('svg .etapa').length;
    if (etapas && etapas !== itens.length) erros.push(`${nome}: SVG tem ${etapas} etapas e a lista tem ${itens.length} itens`);
  }
  if (ciclo) {
    if (itens.length !== ciclo.length) erros.push(`${nome}: lista tem ${itens.length} itens e o ciclo nos dados tem ${ciclo.length}`);
    else ciclo.forEach((e, i) => {
      if (!textoDe(itens[i]).includes(String(e.rotulo).toLowerCase())) erros.push(`${nome}: item ${i + 1} deveria mencionar "${e.rotulo}"`);
    });
  }
  return erros;
}

export function verificarAlternativasOl(doc, ferramenta = null) {
  const ciclo = ferramenta?.ciclo ?? null;
  const erros = [];
  [...doc.querySelectorAll('.diagrama')].forEach((el, i) => {
    const alvo = el.getAttribute('data-ferramenta');
    erros.push(...verificarOl(el, `.diagrama #${i + 1}`, !alvo || alvo === ferramenta?.id ? ciclo : null));
  });
  [...doc.querySelectorAll('.linha-tempo')].forEach((el, i) => erros.push(...verificarOl(el, `.linha-tempo #${i + 1}`, ciclo)));
  return erros;
}

// ---------- Recursos externos (R18.11, R17.16) ----------
const EXTERNO = /^\s*(https?:)?\/\//i;
const ATRIBUTOS = [
  ['link[href]', 'href'], ['script[src]', 'src'], ['img[src]', 'src'], ['iframe[src]', 'src'],
  ['source[src]', 'src'], ['video[src]', 'src'], ['audio[src]', 'src'], ['embed[src]', 'src'],
  ['object[data]', 'data'], ['use', 'href'], ['use', 'xlink:href'], ['image', 'href'], ['image', 'xlink:href'],
];

export function verificarRecursosExternosCss(css, origem = 'css') {
  const limpo = String(css).replace(/\/\*[\s\S]*?\*\//g, '');
  const erros = [];
  for (const m of limpo.matchAll(/url\(\s*['"]?\s*((?:https?:)?\/\/[^'")\s]+)/gi)) erros.push(`${origem}: recurso externo em url(${m[1]})`);
  for (const m of limpo.matchAll(/@import\s+(?:url\(\s*)?['"]?\s*((?:https?:)?\/\/[^'")\s;]+)/gi)) erros.push(`${origem}: @import externo ${m[1]}`);
  return erros;
}

export function verificarRecursosExternos(doc) {
  const erros = [];
  for (const [sel, attr] of ATRIBUTOS) {
    for (const el of doc.querySelectorAll(sel)) {
      const v = el.getAttribute(attr);
      if (v && EXTERNO.test(v)) erros.push(`<${el.tagName.toLowerCase()}> carrega recurso externo: ${v}`);
    }
  }
  for (const st of doc.querySelectorAll('style')) erros.push(...verificarRecursosExternosCss(st.textContent, '<style>'));
  for (const el of doc.querySelectorAll('[style]')) erros.push(...verificarRecursosExternosCss(el.getAttribute('style'), 'style=""'));
  return erros;
}

// ---------- Transições e animações (R17.14) ----------
const semComentarios = (css) => String(css).replace(/\/\*[\s\S]*?\*\//g, '');

export function variaveisCss(css) {
  const vars = {};
  for (const m of semComentarios(css).matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) vars[m[1]] = m[2].trim();
  return vars;
}

function resolver(valor, vars, profundidade = 0) {
  if (profundidade > 5) return valor;
  return valor.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, nome, padrao) =>
    vars[nome] !== undefined ? resolver(vars[nome], vars, profundidade + 1) : (padrao ?? ''));
}

function dividirTopo(texto) {
  const partes = []; let prof = 0, atual = '';
  for (const c of texto) {
    if (c === '(') prof++;
    if (c === ')') prof--;
    if (c === ',' && prof === 0) { partes.push(atual); atual = ''; } else atual += c;
  }
  partes.push(atual);
  return partes;
}

const tempos = (s) => [...s.matchAll(/(?<![\w.-])(\d*\.?\d+)(ms|s)\b/g)].map((m) => (m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1])));

export function verificarTransicoes(css, vars = variaveisCss(css), origem = 'css') {
  const erros = [];
  // Cada bloco `{...}` é analisado com suas declarações; custom properties (--x) são ignoradas.
  for (const m of semComentarios(css).matchAll(/(?<![\w-])(transition|transition-duration|animation|animation-duration)\s*:\s*([^;}]+)/g)) {
    const prop = m[1];
    const valor = resolver(m[2], vars);
    if (/^\s*none\b/.test(valor)) continue;
    for (const segmento of dividirTopo(valor)) {
      const t = tempos(segmento);
      const duracao = prop.endsWith('duration') ? t : t.slice(0, 1);
      for (const ms of duracao) {
        if (prop.startsWith('transition') && ms > LIMITE_TRANSICAO_MS) erros.push(`${origem}: transição de ${ms}ms excede ${LIMITE_TRANSICAO_MS}ms (${prop}: ${norm(m[2])})`);
        if (prop.startsWith('animation') && /\binfinite\b/.test(segmento) && ms > LIMITE_LACO_MS) erros.push(`${origem}: animação em laço de ${ms}ms excede ${LIMITE_LACO_MS}ms`);
      }
    }
  }
  return erros;
}

// ---------- prefers-reduced-motion (R17.15) ----------
export function verificarReducedMotion(css) {
  const limpo = semComentarios(css);
  const i = limpo.search(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i);
  if (i < 0) return ['falta o bloco @media (prefers-reduced-motion: reduce)'];
  let prof = 0, fim = limpo.length, aberto = false;
  for (let k = limpo.indexOf('{', i); k < limpo.length; k++) {
    if (limpo[k] === '{') { prof++; aberto = true; }
    if (limpo[k] === '}') prof--;
    if (aberto && prof === 0) { fim = k; break; }
  }
  const bloco = limpo.slice(i, fim);
  const erros = [];
  if (!/animation(-duration)?\s*:\s*(none|0s|0\.01ms)/.test(bloco)) erros.push('o bloco prefers-reduced-motion não desliga `animation`');
  if (!/transition(-duration)?\s*:\s*(none|0s|0\.01ms)/.test(bloco)) erros.push('o bloco prefers-reduced-motion não desliga `transition`');
  return erros;
}

// ---------- Contraste (R18.4) ----------
function paraRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16));
}
const luminancia = (rgb) => {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function razaoContraste(corA, corB) {
  const a = paraRgb(corA), b = paraRgb(corB);
  if (!a || !b) return NaN;
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export function verificarContraste(tokensCss, ferramentas = []) {
  const vars = variaveisCss(tokensCss);
  const erros = [];
  for (const [fg, bg, min] of PARES_CONTRASTE) {
    if (!vars[fg] || !vars[bg]) { erros.push(`token ausente para o par ${fg}/${bg}`); continue; }
    const r = razaoContraste(resolver(vars[fg], vars), resolver(vars[bg], vars));
    if (!(r >= min)) erros.push(`contraste ${fg}/${bg} = ${Number.isNaN(r) ? 'inválido' : r.toFixed(2)}:1 (mínimo ${min}:1)`);
  }
  const fundo = vars['--cor-fundo'];
  for (const f of ferramentas) {
    const cor = f.identidade?.cor;
    const r = fundo && cor ? razaoContraste(cor, fundo) : NaN;
    if (!(r >= CONTRASTE_NAO_TEXTO)) erros.push(`cor da ferramenta ${f.id} (${cor}) tem contraste ${Number.isNaN(r) ? 'inválido' : r.toFixed(2)}:1 contra o fundo (mínimo 3:1)`);
  }
  return erros;
}

// ---------- Contagens de Diagrama e Stepper contra os dados (R17.3, R17.5) ----------
export function verificarContagens(doc, ferramenta) {
  const erros = [];
  if (!ferramenta) return ['ferramenta do tutorial não encontrada nos dados'];
  const diagramas = [...doc.querySelectorAll('.diagrama')].filter((d) => !d.getAttribute('data-ferramenta') || d.getAttribute('data-ferramenta') === ferramenta.id);
  if (!diagramas.length) erros.push('Tutorial sem Diagrama_Fluxo (.diagrama)');
  for (const d of diagramas) {
    const etapas = d.querySelectorAll('svg .etapa').length;
    if (etapas !== ferramenta.ciclo.length) erros.push(`Diagrama_Fluxo tem ${etapas} etapas; o ciclo nos dados tem ${ferramenta.ciclo.length}`);
  }
  const steppers = [...doc.querySelectorAll('.stepper, [data-componente="stepper"]')];
  if (!steppers.length) erros.push('Tutorial sem Stepper');
  for (const s of steppers) {
    const passos = [...s.children].filter((c) => c.tagName.toLowerCase() === 'li').length;
    if (passos !== ferramenta.passos.length) erros.push(`Stepper tem ${passos} passos; os dados têm ${ferramenta.passos.length}`);
  }
  return erros;
}

// ---------- Comandos dos tutoriais (R5.9, R16.4) ----------
const casar = (permitido) => new RegExp('^' + permitido.split(/<[^>]+>/).map((p) => norm(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+') + '$');

export function verificarComandos(doc, ferramenta) {
  if (!ferramenta) return [];
  const regras = (ferramenta.comandosPermitidos ?? []).map(casar);
  const erros = [];
  for (const el of doc.querySelectorAll('[data-comando], .comando')) {
    for (const linha of String(el.textContent).split('\n').map(norm)) {
      if (!linha || linha.startsWith('#')) continue;
      if (!regras.some((r) => r.test(linha))) erros.push(`comando fora de comandosPermitidos (${ferramenta.id}): ${linha}`);
    }
  }
  return erros;
}

// ---------- Botão_Concluir (R19.1, R19.9) ----------
export function idsLicoes(catalogo) {
  return new Set(catalogo.modulos.flatMap((m) => m.itens).filter((i) => i.tipo === 'licao' || i.tipo === 'tutorial').map((i) => i.id));
}

/** Devolve { erros, id } para uma página de Lição. */
export function verificarBotaoConcluir(doc, catalogo, idEsperado = null) {
  const botoes = [...doc.querySelectorAll('[data-componente="botao-concluir"]')];
  if (botoes.length === 0) return { erros: ['falta o Botão_Concluir (data-componente="botao-concluir")'], id: null };
  if (botoes.length > 1) return { erros: [`há ${botoes.length} Botões_Concluir; esperado exatamente 1`], id: null };
  const b = botoes[0], erros = [];
  const id = b.getAttribute('data-licao');
  if (b.tagName.toLowerCase() !== 'button') erros.push('o Botão_Concluir deve ser um elemento <button>');
  else if ((b.getAttribute('type') || 'submit') !== 'button') erros.push('o Botão_Concluir deve ter type="button"');
  if (b.getAttribute('aria-pressed') !== 'false') erros.push('o Botão_Concluir deve começar com aria-pressed="false"');
  if (!norm(b.textContent)) erros.push('o Botão_Concluir precisa de nome acessível (texto)');
  if (!id || !id.startsWith('licao:')) erros.push(`data-licao deve ser um id "licao:..." (encontrado: ${id ?? 'ausente'})`);
  else if (!idsLicoes(catalogo).has(id)) erros.push(`data-licao "${id}" não existe no catálogo`);
  else if (idEsperado && id !== idEsperado) erros.push(`data-licao "${id}" não corresponde a esta página (esperado "${idEsperado}")`);
  return { erros, id: erros.length ? null : id };
}

// ---------- Tutorial para ferramenta com erro de dados (R5.8) ----------
export function verificarTutorialSemDados(ferramenta, validar, existeTutorial) {
  if (!existeTutorial) return [];
  if (!ferramenta) return ['existe Tutorial para ferramenta ausente dos dados'];
  const erros = validar(ferramenta);
  return erros.length ? [`existe Tutorial para ${ferramenta.id}, que tem erro de dados: ${erros.join('; ')}`] : [];
}

// ---------- Análise de uma página ----------
/**
 * @param {string} html
 * @param {{item?:object, modulo?:object, catalogo:object, ferramentas:object[]}} ctx
 * @returns {{erros:string[], botaoId:string|null}}
 */
export function analisarPagina(html, ctx) {
  const doc = parsear(html);
  const { item, modulo, catalogo, ferramentas = [] } = ctx;
  const ehLicao = item && (item.tipo === 'licao' || item.tipo === 'tutorial');
  const ferramenta = modulo?.ferramenta ? ferramentas.find((f) => f.id === modulo.ferramenta) ?? null : null;
  const erros = [
    ...verificarLang(doc), ...verificarSvgs(doc), ...verificarRecursosExternos(doc),
    ...verificarAlternativasOl(doc, ferramenta), ...verificarBlocosTexto(doc),
  ];
  for (const st of doc.querySelectorAll('style')) erros.push(...verificarTransicoes(st.textContent, undefined, '<style>'));
  let botaoId = null;
  if (ehLicao) {
    erros.push(...verificarElementoVisual(doc));
    const r = verificarBotaoConcluir(doc, catalogo, item.id);
    erros.push(...r.erros);
    botaoId = r.id;
  }
  if (item?.tipo === 'tutorial') {
    erros.push(...verificarContagens(doc, ferramenta), ...verificarComandos(doc, ferramenta));
  }
  return { erros, botaoId };
}

// ---------- Análise do projeto ----------
async function listar(dir, filtro, raiz = dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.kiro', 'tests'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await listar(p, filtro, raiz, acc);
    else if (filtro(e.name)) acc.push(path.relative(raiz, p).split(path.sep).join('/'));
  }
  return acc;
}

/**
 * @returns {Promise<{erros:string[], avisos:string[], paginas:number}>}
 */
export async function analisarProjeto(raiz, { estrito = false, catalogo, ferramentas, validarFerramenta } = {}) {
  if (!catalogo || !ferramentas || !validarFerramenta) {
    const url = (p) => pathToFileURL(path.join(raiz, p)).href;
    catalogo ??= (await import(url('assets/data/catalogo.js'))).catalogo;
    const dados = await import(url('assets/data/ferramentas.js'));
    ferramentas ??= dados.ferramentas;
    validarFerramenta ??= dados.validarFerramenta;
  }
  const erros = [], avisos = [];
  const add = (origem, lista) => lista.forEach((m) => erros.push(`${origem}: ${m}`));

  // CSS global
  const arquivosCss = await listar(path.join(raiz, 'assets/css'), (n) => n.endsWith('.css'), raiz);
  let cssTotal = '';
  const cssPorArquivo = {};
  for (const rel of arquivosCss) {
    const css = await readFile(path.join(raiz, rel), 'utf8');
    cssTotal += '\n' + css;
    cssPorArquivo[rel] = css;
    add(rel, verificarRecursosExternosCss(css));
  }
  if (!arquivosCss.length) avisos.push('nenhum CSS encontrado em assets/css');
  else {
    const vars = variaveisCss(cssTotal);
    for (const rel of arquivosCss) add(rel, verificarTransicoes(cssPorArquivo[rel], vars, rel));
    add('assets/css', verificarReducedMotion(cssTotal));
  }
  const tokens = path.join(raiz, 'assets/css/tokens.css');
  if (existsSync(tokens)) add('assets/css/tokens.css', verificarContraste(await readFile(tokens, 'utf8'), ferramentas));
  else erros.push('assets/css/tokens.css não encontrado');

  for (const rel of await listar(path.join(raiz, 'assets/svg'), (n) => n.endsWith('.svg'), raiz)) {
    const svg = await readFile(path.join(raiz, rel), 'utf8');
    for (const m of svg.matchAll(/(?:xlink:)?href\s*=\s*["']\s*((?:https?:)?\/\/[^"']+)/gi)) erros.push(`${rel}: recurso externo ${m[1]}`);
    add(rel, verificarRecursosExternosCss(svg));
  }

  // Páginas
  const porUrl = new Map();
  for (const m of catalogo.modulos) for (const i of m.itens) porUrl.set(i.url, { item: i, modulo: m });
  const paginas = await listar(raiz, (n) => n.endsWith('.html'));
  const cobertos = new Set();
  let licoesEncontradas = 0;
  for (const rel of paginas) {
    const html = await readFile(path.join(raiz, rel), 'utf8');
    const ctx = { ...(porUrl.get(rel) ?? {}), catalogo, ferramentas };
    if (ctx.item && (ctx.item.tipo === 'licao' || ctx.item.tipo === 'tutorial')) licoesEncontradas++;
    const r = analisarPagina(html, ctx);
    add(rel, r.erros);
    if (r.botaoId) cobertos.add(r.botaoId);
    if (ctx.item?.tipo === 'tutorial') {
      const f = ferramentas.find((x) => x.id === ctx.modulo.ferramenta);
      add(rel, verificarTutorialSemDados(f, validarFerramenta, true));
    }
  }

  // Cobertura das lições do catálogo
  const faltando = [...idsLicoes(catalogo)].filter((id) => !cobertos.has(id));
  if (licoesEncontradas === 0 && !estrito) {
    avisos.push(`nenhuma página de Lição encontrada ainda (${paginas.length} HTML no projeto); verificação do Botão_Concluir por lição adiada (use --estrito para falhar)`);
  } else {
    for (const id of faltando) erros.push(`lição do catálogo sem página com Botão_Concluir: ${id}`);
  }
  return { erros, avisos, paginas: paginas.length };
}

// ---------- CLI ----------
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const estrito = process.argv.includes('--estrito');
  const { erros, avisos, paginas } = await analisarProjeto(raiz, { estrito });
  for (const a of avisos) console.warn(`AVISO: ${a}`);
  for (const e of erros) console.error(`ERRO: ${e}`);
  console.log(`verificar-conteudo: ${paginas} página(s) HTML, ${erros.length} erro(s), ${avisos.length} aviso(s)`);
  process.exit(erros.length ? 1 : 0);
}
