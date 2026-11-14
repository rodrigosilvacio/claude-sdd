// Testes de exemplo e fumaça do site (tarefa 13.9).
// Requisitos: 1.x, 2.x, 14.13, 14.14, 15.x, 18.8, 18.9.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import catalogo from '../../assets/data/catalogo.js';
import { ferramentas } from '../../assets/data/ferramentas.js';
import { desenharCertificado, ativar, PNG_LARGURA, PNG_ALTURA, PNG_NOME_ARQUIVO } from '../../assets/js/ui/certificado-ui.js';
import { verificarSite } from '../../tools/verificar-orcamento.mjs';
import { gerenciadorMemoria, concluirTudo, disparar } from '../auxiliar/dom.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ler = (rel) => readFileSync(path.join(RAIZ, rel), 'utf8');
const dom = (rel) => parseHTML(ler(rel)).document;

function listarHtml(dir) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === 'tests' || nome.startsWith('.')) continue;
    const p = path.join(dir, nome);
    if (statSync(p).isDirectory()) out.push(...listarHtml(p));
    else if (nome.endsWith('.html')) out.push(p);
  }
  return out;
}
const paginas = listarHtml(RAIZ).map((p) => path.relative(RAIZ, p).split(path.sep).join('/'));

test('sete ferramentas e nove módulos presentes (R1, R2)', () => {
  assert.equal(ferramentas.length, 7);
  assert.equal(catalogo.modulos.length, 9);
  const pastas = readdirSync(path.join(RAIZ, 'modulos')).sort();
  assert.deepEqual(pastas, catalogo.modulos.map((m) => m.pasta).sort());
  for (const m of catalogo.modulos) assert.ok(existsSync(path.join(RAIZ, m.url)), `existe ${m.url}`);
  const doc = dom('index.html');
  const nomes = [...doc.querySelectorAll('section[aria-labelledby="ferramentas-titulo"] li')].map((l) => l.textContent.trim());
  assert.equal(nomes.length, 7);
  assert.equal(doc.querySelectorAll('section[aria-labelledby="modulos-titulo"] li').length, 9);
});

test('carga horária de 24 h no catálogo e na página inicial (R2.4, R14.10)', () => {
  assert.equal(catalogo.cargaHorariaHoras, 24);
  assert.match(dom('index.html').body.textContent, /24\s*horas/);
});

test('presença de .nojekyll, index, 404, comparador e certificado na raiz (R1.2, R1.3)', () => {
  for (const f of ['.nojekyll', 'index.html', '404.html', 'comparador.html', 'certificado.html']) {
    assert.ok(existsSync(path.join(RAIZ, f)), `${f} na raiz`);
  }
});

test('404.html: link index.html relativo e sem caminho absoluto de recurso (R1.4)', () => {
  const doc = dom('404.html');
  assert.equal(doc.querySelector('a#inicio').getAttribute('href'), 'index.html');
  assert.equal(doc.querySelectorAll('script[src], link[href]').length, 0);
});

test('ausência de Tessl em catálogo, ferramentas, quizzes e páginas (R1.x)', async () => {
  const quizzes = await import('../../assets/data/quizzes.js');
  const dados = JSON.stringify([catalogo, ferramentas, quizzes.default ?? quizzes]);
  assert.doesNotMatch(dados, /tessl/i);
  for (const p of paginas) assert.doesNotMatch(ler(p), /tessl/i, p);
});

test('nenhum recurso externo nem caminho absoluto interno nas páginas (R1.3, R1.4)', () => {
  const abs = /^(?:[a-z][a-z0-9+.-]*:|\/)/i;
  for (const p of paginas) {
    const doc = dom(p);
    for (const el of doc.querySelectorAll('script[src], link[href], img[src], source[src], iframe[src], use[href]')) {
      const url = el.getAttribute('src') || el.getAttribute('href');
      assert.ok(!abs.test(url) || url.startsWith('#'), `${p}: recurso ${url} deve ser relativo`);
    }
    for (const a of doc.querySelectorAll('a[href]')) {
      assert.ok(!a.getAttribute('href').startsWith('/'), `${p}: link absoluto ${a.getAttribute('href')}`);
    }
  }
});

test('.nojekyll existe e package.json não tem dependências de runtime (R1.7)', () => {
  assert.ok(existsSync(path.join(RAIZ, '.nojekyll')));
  const pkg = JSON.parse(ler('package.json'));
  assert.equal(pkg.dependencies, undefined);
  assert.ok(pkg.devDependencies);
});

// ---- PNG do certificado (R14.13, R14.14) ----
const MODELO = { titulo: 'Curso', nome: 'Ana Souza', cargaHoraria: 24, data: '01/01/2027', declaracao: 'Declaração de teste.' };

function contextoFalso() {
  const chamadas = [];
  const ctx = new Proxy({ measureText: (t) => ({ width: String(t).length * 10 }) }, {
    get: (alvo, k) => (k in alvo ? alvo[k] : (...a) => { chamadas.push([k, ...a]); }),
    set: (alvo, k, v) => { alvo[k] = v; return true; },
  });
  return { ctx, chamadas };
}

test('desenharCertificado: canvas falso 1754×1240 recebe o nome via fillText (R14.13)', () => {
  const { ctx, chamadas } = contextoFalso();
  const canvas = { getContext: (t) => (t === '2d' ? ctx : null) };
  assert.equal(desenharCertificado(canvas, MODELO), true);
  assert.equal(canvas.width, 1754);
  assert.equal(canvas.height, 1240);
  assert.equal(PNG_LARGURA, 1754);
  assert.equal(PNG_ALTURA, 1240);
  const textos = chamadas.filter((c) => c[0] === 'fillText').map((c) => c[1]);
  assert.ok(textos.includes('Ana Souza'));
  assert.ok(textos.includes('Carga horária estimada: 24 horas'));
});

test('desenharCertificado: sem getContext retorna false (R14.14)', () => {
  assert.equal(desenharCertificado({}, MODELO), false);
});

function montarCertificado({ comCanvas }) {
  const { window, document } = parseHTML('<!doctype html><html><body><section data-componente="certificado"></section></body></html>');
  const { ctx } = contextoFalso();
  const blobs = [];
  const criarOriginal = document.createElement.bind(document);
  document.createElement = (tag) => {
    const el = criarOriginal(tag);
    if (String(tag).toLowerCase() === 'canvas') {
      if (comCanvas) {
        el.getContext = () => ctx;
        el.toBlob = (cb, tipo) => { blobs.push(tipo); cb({ tipo }); };
      } else {
        el.getContext = undefined;
      }
    }
    return el;
  };
  const baixados = [];
  const win = {
    print() {},
    URL: { createObjectURL: () => 'blob:falso', revokeObjectURL() {} },
  };
  const g = gerenciadorMemoria();
  const raiz = document.querySelector('section');
  ativar([raiz], { gerenciador: g, catalogo, doc: document, win });
  concluirTudo(g, catalogo);
  const q = (n) => raiz.querySelector(`[data-certificado="${n}"]`);
  return { window, document, q, blobs, baixados };
}

test('botão PNG fica oculto quando o canvas não tem getContext (R14.14)', () => {
  const t = montarCertificado({ comCanvas: false });
  assert.equal(t.q('png').hidden, true);
});

test('botão PNG visível e chama toBlob com image/png ao gerar e clicar (R14.13)', () => {
  const t = montarCertificado({ comCanvas: true });
  assert.equal(t.q('png').hidden, false);
  t.q('nome').value = 'Ana Souza';
  disparar(t.window, t.q('gerar'), 'click');
  disparar(t.window, t.q('png'), 'click');
  assert.deepEqual(t.blobs, ['image/png']);
  assert.equal(PNG_NOME_ARQUIVO, 'certificado-sdd.png');
});

// ---- Orçamento com páginas reais (R18.8, R18.9) ----
test('verificar-orcamento: todas as páginas reais dentro dos limites (R18.8, R18.9)', () => {
  const resultados = verificarSite(RAIZ);
  assert.ok(resultados.length >= paginas.length);
  for (const r of resultados) assert.deepEqual(r.erros, [], `${r.pagina}: ${r.erros.join('; ')}`);
});
