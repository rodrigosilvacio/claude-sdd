// Verificador_Links: confere links internos, lista revisões necessárias e erros de dados.
// Uso: node tools/verificar-links.mjs [--externos] [--raiz <pasta>] [--timeout <ms>]
// A lógica de análise é exportada; a CLI só roda quando o script é executado diretamente.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const IGNORAR = new Set(['node_modules', '.git', '.kiro']);
const REGEX_ATRIBUTO = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const REGEX_CHAVE_DADOS = /\b(?:href|src|url|icone|urlOficial)\s*:\s*(?:"([^"]*)"|'([^']*)')/g;
const REGEX_URL_HTTP = /https?:\/\/[^\s"'`<>)\]\\]+/gi;

/** Lista recursivamente os *.html da raiz e os *.js de assets/data (caminhos relativos, com "/"). */
export function listarArquivos(raiz) {
  const saida = [];
  const andar = (dir) => {
    for (const nome of readdirSync(dir).sort()) {
      if (IGNORAR.has(nome)) continue;
      const abs = path.join(dir, nome);
      if (statSync(abs).isDirectory()) { andar(abs); continue; }
      const rel = path.relative(raiz, abs).split(path.sep).join('/');
      if (nome.endsWith('.html') || /^assets\/data\/[^/]+\.js$/.test(rel)) saida.push(rel);
    }
  };
  andar(raiz);
  return saida;
}

/** Extrai valores de href/src (e, em arquivos de dados, chaves url/icone/urlOficial e URLs http). */
export function extrairLinks(texto, arquivo = '') {
  const achados = new Set();
  for (const m of texto.matchAll(REGEX_ATRIBUTO)) achados.add((m[1] ?? m[2]).trim());
  if (arquivo.endsWith('.js')) {
    for (const m of texto.matchAll(REGEX_CHAVE_DADOS)) achados.add((m[1] ?? m[2]).trim());
    for (const m of texto.matchAll(REGEX_URL_HTTP)) achados.add(m[0].replace(/[.,;]+$/, ''));
  }
  achados.delete('');
  return [...achados];
}

export const ehExterno = (l) => /^https?:\/\//i.test(l) || l.startsWith('//');
const ehIgnorado = (l) =>
  l.startsWith('#') || /^(mailto|tel|javascript|data|blob):/i.test(l) || l.includes('${');

export const temUtmSource = (l) => /[?&]utm_source=/i.test(l) || /utm_source/i.test(l);

/** Resolve um link interno para caminho relativo à raiz (com "/"); null se sair da raiz. */
export function resolverInterno(origem, link) {
  const limpo = link.split('#')[0].split('?')[0];
  if (limpo === '') return origem;
  const base = limpo.startsWith('/') ? limpo.slice(1)
    : path.posix.join(path.posix.dirname(arquivoComoPosix(origem)), limpo);
  const norm = path.posix.normalize(base);
  if (norm.startsWith('..')) return null;
  return limpo.endsWith('/') ? norm.replace(/\/?$/, '/') : norm;
}
const arquivoComoPosix = (p) => p.split(path.sep).join('/');

/** Em arquivos de dados, links internos são relativos à raiz do site (as páginas os usam em várias profundidades). */
function origemParaResolucao(arquivo) {
  return arquivo.startsWith('assets/data/') ? 'index.html' : arquivo;
}

/**
 * Analisa uma lista de arquivos { arquivo, texto }.
 * existe(rel) => boolean indica se o destino existe (arquivo ou pasta com index.html).
 */
export function analisar(fontes, existe) {
  const quebrados = [];
  const revisao = [];
  const externos = new Set();
  for (const { arquivo, texto } of fontes) {
    for (const link of extrairLinks(texto, arquivo)) {
      if (ehIgnorado(link)) continue;
      if (temUtmSource(link)) revisao.push({ origem: arquivo, destino: link, motivo: 'utm_source' });
      if (ehExterno(link)) { externos.add(link); continue; }
      const alvo = resolverInterno(origemParaResolucao(arquivo), link);
      if (alvo === null || !existe(alvo)) quebrados.push({ origem: arquivo, destino: link });
    }
  }
  return { quebrados, revisao, externos: [...externos] };
}

/** existe() baseado no sistema de arquivos. */
export function existeNoDisco(raiz) {
  return (rel) => {
    const abs = path.join(raiz, rel);
    if (!existsSync(abs)) return false;
    if (statSync(abs).isDirectory()) return existsSync(path.join(abs, 'index.html'));
    return true;
  };
}

/** Erros de dados: ferramentas com falha em validarFerramenta. */
export function errosDeDados(ferramentas, validar) {
  const erros = [];
  for (const f of ferramentas) {
    for (const e of validar(f)) erros.push({ ferramenta: f.id ?? '(sem id)', erro: e });
  }
  return erros;
}

/** Consulta uma URL externa: HEAD com fallback GET e timeout. Devolve { ok, status } ou { ok:false, erro }. */
export async function consultarExterno(url, { timeoutMs = 10000, fetchFn = globalThis.fetch } = {}) {
  const tentar = async (method) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      return await fetchFn(url, { method, redirect: 'follow', signal: ctl.signal });
    } finally { clearTimeout(t); }
  };
  const bom = (r) => r.status >= 200 && r.status < 400;
  try {
    const r = await tentar('HEAD');
    if (bom(r)) return { ok: true, status: r.status };
  } catch { /* cai para GET */ }
  try {
    const r = await tentar('GET');
    return { ok: bom(r), status: r.status };
  } catch (e) {
    return { ok: false, erro: e?.name === 'AbortError' ? 'timeout' : String(e?.message ?? e) };
  }
}

export async function verificarExternos(urls, opcoes = {}) {
  const lista = [];
  for (const url of urls) {
    const r = await consultarExterno(url, opcoes);
    if (!r.ok) lista.push({ destino: url, motivo: r.erro ?? `HTTP ${r.status}` });
  }
  return lista;
}

/** Executa a verificação completa e devolve o relatório e o código de saída. */
export async function verificar({ raiz, externos = false, timeoutMs = 10000, fetchFn } = {}) {
  const arquivos = listarArquivos(raiz);
  const fontes = arquivos.map((arquivo) => ({ arquivo, texto: readFileSync(path.join(raiz, arquivo), 'utf8') }));
  const { quebrados, revisao, externos: urls } = analisar(fontes, existeNoDisco(raiz));

  let dados = [];
  const arqFerr = path.join(raiz, 'assets/data/ferramentas.js');
  if (existsSync(arqFerr)) {
    const mod = await import(pathToFileURL(arqFerr).href);
    dados = errosDeDados(mod.ferramentas ?? [], mod.validarFerramenta);
  }

  const revisaoExterna = externos ? await verificarExternos(urls, { timeoutMs, fetchFn }) : [];
  return {
    quebrados, revisao, dados, revisaoExterna,
    codigo: quebrados.length > 0 ? 1 : 0,
  };
}

export function formatarRelatorio(r) {
  const linhas = [];
  for (const q of r.quebrados) linhas.push(`QUEBRADO: ${q.origem} -> ${q.destino}`);
  for (const v of r.revisao) linhas.push(`REVISÃO NECESSÁRIA (utm_source): ${v.origem} -> ${v.destino}`);
  for (const v of r.revisaoExterna) linhas.push(`REVISÃO NECESSÁRIA (externo): ${v.destino} (${v.motivo})`);
  for (const d of r.dados) linhas.push(`ERRO DE DADOS: ${d.ferramenta}: ${d.erro}`);
  linhas.push(r.quebrados.length ? `${r.quebrados.length} link(s) interno(s) quebrado(s).` : 'Nenhum link interno quebrado.');
  return linhas.join('\n');
}

function lerArgs(argv) {
  const o = { externos: false, raiz: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), timeoutMs: 10000 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--externos') o.externos = true;
    else if (argv[i] === '--raiz') o.raiz = path.resolve(argv[++i]);
    else if (argv[i] === '--timeout') o.timeoutMs = Number(argv[++i]) || o.timeoutMs;
  }
  return o;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const r = await verificar(lerArgs(process.argv.slice(2)));
  console.log(formatarRelatorio(r));
  process.exitCode = r.codigo;
}
