import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { catalogo } from '../../assets/data/catalogo.js';
import { ferramentas } from '../../assets/data/ferramentas.js';
import {
  analisarPagina, parsear, verificarLang, verificarBlocosTexto, verificarSvgs,
  verificarRecursosExternos, verificarBotaoConcluir, verificarElementoVisual,
  verificarAlternativasOl, LIMITE_PALAVRAS,
} from '../../tools/verificar-conteudo.mjs';

// Feature: comparacoes-sdds, Property 21: Estrutura e acessibilidade das páginas
// **Validates: Requirements 1.7, 10.1, 17.1, 17.2, 18.1, 18.2, 18.11**

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TAG = 'Feature: comparacoes-sdds, Property 21: Estrutura e acessibilidade das páginas';

async function htmls(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.kiro', 'tests', 'tools', 'assets'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await htmls(p, acc);
    else if (e.name.endsWith('.html')) acc.push(path.relative(RAIZ, p).split(path.sep).join('/'));
  }
  return acc;
}

const porUrl = new Map();
for (const m of catalogo.modulos) for (const i of m.itens) porUrl.set(i.url, { item: i, modulo: m });
const ctxDe = (rel) => ({ ...(porUrl.get(rel) ?? {}), catalogo, ferramentas });
const ehLicao = (rel) => ['licao', 'tutorial'].includes(porUrl.get(rel)?.item.tipo);

const paginas = await htmls(RAIZ);
const conteudo = new Map(await Promise.all(paginas.map(async (p) => [p, await readFile(path.join(RAIZ, p), 'utf8')])));
const licoes = paginas.filter(ehLicao);

test(`${TAG}: existem páginas reais e lições`, () => {
  assert.ok(paginas.length > 0);
  assert.ok(licoes.length > 0);
});

test(`${TAG}: toda página real satisfaz lang, Blocos_Texto, SVG, <ol>, Botão_Concluir e recursos locais`, () => {
  fc.assert(
    fc.property(fc.constantFrom(...paginas), (rel) => {
      const html = conteudo.get(rel);
      const doc = parsear(html);
      assert.deepEqual(verificarLang(doc), [], rel);
      assert.deepEqual(verificarBlocosTexto(doc), [], rel);
      assert.deepEqual(verificarSvgs(doc), [], rel);
      assert.deepEqual(verificarRecursosExternos(doc), [], rel);
      if (ehLicao(rel)) {
        assert.deepEqual(verificarElementoVisual(doc), [], rel);
        const { erros } = verificarBotaoConcluir(doc, catalogo, porUrl.get(rel).item.id);
        assert.deepEqual(erros, [], rel);
        assert.equal(doc.querySelectorAll('[data-componente="botao-concluir"]').length, 1, rel);
      }
      const erros = analisarPagina(html, ctxDe(rel)).erros;
      assert.deepEqual(erros, [], rel);
    }),
    { numRuns: 100 },
  );
});

// ---------- Mutações que o verificador deve rejeitar ----------
const palavra = fc.constantFrom('spec', 'fluxo', 'tarefa', 'design', 'código', 'agente', 'plano');
const textoLongo = fc.array(palavra, { minLength: LIMITE_PALAVRAS + 1, maxLength: 220 }).map((p) => p.join(' '));
const hostExterno = fc.constantFrom('cdn.example.com', 'fonts.googleapis.com', 'example.org');
const langErrado = fc.constantFrom('en', 'pt', 'pt-PT', 'en-US', '', 'PT-br');

/** Cada mutação recebe o documento de uma lição válida e o item, e o torna inválido. */
const mutacoes = fc.oneof(
  langErrado.map((l) => ({ nome: 'lang', aplicar: (d) => d.documentElement.setAttribute('lang', l) })),
  fc.constant({ nome: 'sem lang', aplicar: (d) => d.documentElement.removeAttribute('lang') }),
  textoLongo.map((t) => ({
    nome: 'bloco longo',
    aplicar: (d) => {
      const p = d.createElement('p');
      p.textContent = t;
      (d.querySelector('main') || d.body).appendChild(p);
    },
  })),
  fc.constantFrom('', 'role="presentation"', 'role="img"', 'aria-label="x"').map((attrs) => ({
    nome: 'svg sem acessibilidade',
    aplicar: (d) => {
      const div = d.createElement('div');
      div.innerHTML = `<svg ${attrs} viewBox="0 0 10 10"><rect width="5" height="5"/></svg>`;
      (d.querySelector('main') || d.body).appendChild(div);
    },
  })),
  hostExterno.chain((h) => fc.constantFrom(
    `<script src="https://${h}/a.js"></script>`,
    `<link rel="stylesheet" href="//${h}/a.css">`,
    `<img src="https://${h}/a.png" alt="x">`,
    `<style>@import url("https://${h}/a.css");</style>`,
  )).map((frag) => ({
    nome: 'recurso externo',
    aplicar: (d) => { const div = d.createElement('div'); div.innerHTML = frag; (d.querySelector('main') || d.body).appendChild(div.firstChild); },
  })),
  fc.constant({
    nome: 'sem botão',
    aplicar: (d) => d.querySelectorAll('[data-componente="botao-concluir"]').forEach((b) => b.remove()),
  }),
  fc.constant({
    nome: 'botão duplicado',
    aplicar: (d) => {
      const b = d.querySelector('[data-componente="botao-concluir"]');
      b.parentNode.appendChild(b.cloneNode(true));
    },
  }),
  fc.constantFrom('', 'licao:inexistente', 'x', 'licao:') .map((v) => ({
    nome: 'data-licao inválido',
    aplicar: (d) => {
      const b = d.querySelector('[data-componente="botao-concluir"]');
      if (v) b.setAttribute('data-licao', v); else b.removeAttribute('data-licao');
    },
  })),
  fc.constant({
    nome: 'diagrama sem ol',
    aplicar: (d) => {
      const div = d.createElement('div');
      div.setAttribute('class', 'diagrama');
      div.innerHTML = '<svg role="img" aria-label="d"><g class="etapa"></g></svg>';
      (d.querySelector('main') || d.body).appendChild(div);
    },
  }),
);

test(`${TAG}: mutações inválidas de lições reais são rejeitadas`, () => {
  fc.assert(
    fc.property(fc.constantFrom(...licoes), mutacoes, (rel, mut) => {
      const doc = parsear(conteudo.get(rel));
      mut.aplicar(doc);
      const { erros } = analisarPagina(doc.toString(), ctxDe(rel));
      assert.ok(erros.length > 0, `${mut.nome} em ${rel} deveria ser rejeitada`);
    }),
    { numRuns: 100 },
  );
});

test(`${TAG}: remover todos os Elementos_Visuais de uma lição é rejeitado`, () => {
  fc.assert(
    fc.property(fc.constantFrom(...licoes), (rel) => {
      const doc = parsear(conteudo.get(rel));
      doc.querySelectorAll('.visual, .diagrama, .linha-tempo, .stepper, .mockup, .cartao, .atividade, table, svg, [data-componente="stepper"], [data-componente="ordenar"], [data-componente="comparador"]').forEach((e) => e.remove());
      assert.ok(verificarElementoVisual(doc).length > 0, rel);
    }),
    { numRuns: 100 },
  );
});

test(`${TAG}: lista <ol> ausente em .diagrama/.linha-tempo é rejeitada`, () => {
  fc.assert(
    fc.property(fc.constantFrom('diagrama', 'linha-tempo'), (classe) => {
      const doc = parsear(`<html lang="pt-BR"><body><main><div class="${classe}"><svg role="img" aria-label="x"></svg></div></main></body></html>`);
      assert.ok(verificarAlternativasOl(doc, null).length > 0);
    }),
    { numRuns: 100 },
  );
});
