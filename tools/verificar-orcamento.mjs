// Verificação do orçamento de peso (R18.8, R18.9).
// Por página HTML: soma bytes sem compactação do JS dos Elementos_Visuais (limite 50 KB)
// e do total CSS + SVG + JS visuais (limite 150 KB).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITE_JS_BYTES = 50 * 1024;
export const LIMITE_TOTAL_BYTES = 150 * 1024;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** JS que implementa Elementos_Visuais (caminhos relativos à raiz, com "/"). */
export function ehJsVisual(rel) {
  return (
    /(^|\/)assets\/js\/ui\/[^/]+\.js$/.test(rel) ||
    /(^|\/)assets\/js\/core\/(grafico|stepper-estado|ordenar)\.js$/.test(rel)
  );
}

/** CSS dos visuais. */
export function ehCssVisual(rel) {
  return /(^|\/)assets\/css\/visuais\.css$/.test(rel);
}

const ehExterna = (u) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(u);
const limpar = (u) => u.split('#')[0].split('?')[0];

/** Referências de scripts, estilos e SVG externos em um HTML. */
export function extrairReferencias(html) {
  const scripts = [];
  const css = [];
  const svgs = [];
  for (const m of html.matchAll(/<script\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)) scripts.push(m[1]);
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const h = /\bhref\s*=\s*["']([^"']+)["']/i.exec(m[0]);
    if (h && /rel\s*=\s*["']?stylesheet/i.test(m[0])) css.push(h[1]);
  }
  for (const m of html.matchAll(/<(?:img|use|object|image)\b[^>]*?\b(?:src|href|data|xlink:href)\s*=\s*["']([^"']+)["']/gi)) {
    if (limpar(m[1]).toLowerCase().endsWith('.svg')) svgs.push(m[1]);
  }
  return {
    scripts: scripts.filter((u) => !ehExterna(u)).map(limpar),
    css: css.filter((u) => !ehExterna(u)).map(limpar),
    svgs: svgs.filter((u) => !ehExterna(u)).map(limpar),
  };
}

/** Bytes dos blocos <svg> inline do HTML. */
export function bytesSvgInline(html) {
  let total = 0;
  for (const m of html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)) total += Buffer.byteLength(m[0]);
  return total;
}

/** Especificadores relativos de import estático e import() dinâmico literal. */
export function extrairImportsJs(codigo) {
  const out = new Set();
  const res = [
    /\bimport\s+(?:[^'"()]*?\bfrom\s*)?["']([^"']+)["']/g,
    /\bexport\s+[^'"()]*?\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of res) for (const m of codigo.matchAll(re)) if (m[1].startsWith('.')) out.add(m[1]);
  return [...out];
}

/**
 * Resolve o fecho transitivo de módulos JS carregados (inclui imports dinâmicos,
 * tratados como carregados no pior caso).
 * `ler(caminhoAbsoluto)` retorna string ou null.
 */
export function resolverJs(entradas, ler) {
  const vistos = new Set();
  const fila = [...entradas];
  while (fila.length) {
    const atual = fila.pop();
    if (vistos.has(atual)) continue;
    const src = ler(atual);
    if (src == null) continue;
    vistos.add(atual);
    for (const imp of extrairImportsJs(src)) fila.push(path.resolve(path.dirname(atual), imp));
  }
  return [...vistos];
}

/** Calcula o orçamento de uma página. */
export function calcularOrcamento(htmlPath, html, ler, raiz = RAIZ) {
  const dir = path.dirname(htmlPath);
  const abs = (u) => (u.startsWith('/') ? path.join(raiz, u) : path.resolve(dir, u));
  const rel = (p) => path.relative(raiz, p).split(path.sep).join('/');
  const tamanho = (p) => {
    const c = ler(p);
    return c == null ? 0 : Buffer.byteLength(c);
  };
  const refs = extrairReferencias(html);

  const jsVisuais = resolverJs(refs.scripts.map(abs), ler).filter((p) => ehJsVisual(rel(p)));
  const cssVisuais = [...new Set(refs.css.map(abs))].filter((p) => ehCssVisual(rel(p)));
  const svgsExternos = [...new Set(refs.svgs.map(abs))];

  const js = jsVisuais.reduce((s, p) => s + tamanho(p), 0);
  const css = cssVisuais.reduce((s, p) => s + tamanho(p), 0);
  const svg = svgsExternos.reduce((s, p) => s + tamanho(p), 0) + bytesSvgInline(html);
  const total = js + css + svg;
  const erros = [];
  if (js > LIMITE_JS_BYTES) erros.push(`JS visual ${js} B excede ${LIMITE_JS_BYTES} B (R18.8)`);
  if (total > LIMITE_TOTAL_BYTES) erros.push(`total visual ${total} B excede ${LIMITE_TOTAL_BYTES} B (R18.9)`);
  return { js, css, svg, total, erros };
}

function listarHtml(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome.startsWith('.')) continue;
    const p = path.join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...listarHtml(p));
    else if (nome.endsWith('.html')) out.push(p);
  }
  return out;
}

const lerArquivo = (p) => (existsSync(p) && statSync(p).isFile() ? readFileSync(p, 'utf8') : null);

export function verificarSite(raiz = RAIZ) {
  const resultados = [];
  for (const p of listarHtml(raiz)) {
    const r = calcularOrcamento(p, readFileSync(p, 'utf8'), lerArquivo, raiz);
    resultados.push({ pagina: path.relative(raiz, p), ...r });
  }
  return resultados;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const resultados = verificarSite();
  let falhou = false;
  const kb = (n) => (n / 1024).toFixed(1);
  for (const r of resultados) {
    console.log(`${r.pagina}: JS ${kb(r.js)} KB, CSS ${kb(r.css)} KB, SVG ${kb(r.svg)} KB, total ${kb(r.total)} KB`);
    for (const e of r.erros) {
      falhou = true;
      console.error(`  ERRO ${r.pagina}: ${e}`);
    }
  }
  if (!resultados.length) console.log('Nenhuma página HTML encontrada.');
  process.exit(falhou ? 1 : 0);
}
