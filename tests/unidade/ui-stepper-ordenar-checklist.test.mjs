// Testes de unidade da UI: Stepper, Atividade de ordenar e Checklist.
// Requisitos: 6.3 a 6.6, 17.10, 17.11, 17.12, 18.6, 18.7.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDom, gerenciadorMemoria, capturaAnuncios, disparar, marcar } from '../auxiliar/dom.mjs';
import { ativarStepper } from '../../assets/js/ui/stepper.js';
import { ativarOrdenar } from '../../assets/js/ui/ordenar.js';
import { ativarChecklist } from '../../assets/js/ui/checklist.js';
import catalogo from '../../assets/data/catalogo.js';

const botaoPor = (raiz, texto) => [...raiz.querySelectorAll('button')].find((b) => b.textContent === texto);

test('stepper: mostra um passo por vez, navega e anuncia "Passo N de M"', () => {
  const { window, document } = criarDom('<ol class="stepper"><li data-titulo="Um">a</li><li><strong>Dois</strong> texto</li><li>Três</li></ol>');
  const lista = document.querySelector('ol');
  const anunciar = capturaAnuncios();
  ativarStepper(lista, { doc: document, anunciar });
  const passos = [...lista.children];
  const visiveis = () => passos.map((li) => !li.hidden);
  const ind = document.querySelector('.stepper-indicador');
  assert.deepEqual(visiveis(), [true, false, false]);
  assert.equal(ind.textContent, 'passo 1 de 3');
  assert.equal(passos[0].getAttribute('aria-current'), 'step');
  const ant = botaoPor(document, 'Anterior'); const prox = botaoPor(document, 'Próximo');
  assert.equal(ant.disabled, true);
  disparar(window, prox, 'click');
  assert.deepEqual(visiveis(), [false, true, false]);
  assert.equal(passos[1].getAttribute('aria-current'), 'step');
  assert.equal(passos[0].hasAttribute('aria-current'), false);
  assert.equal(ind.textContent, 'passo 2 de 3');
  assert.equal(anunciar.lista.at(-1), 'Passo 2 de 3: Dois');
  disparar(window, prox, 'click');
  assert.equal(prox.disabled, true);
  disparar(window, prox, 'click'); // no limite não muda nem anuncia de novo
  assert.equal(anunciar.lista.length, 2);
  disparar(window, ant, 'click');
  assert.equal(ind.textContent, 'passo 2 de 3');
});

test('stepper: setas do teclado navegam e lista vazia não ativa', () => {
  const { window, document } = criarDom('<ol class="stepper"><li>A</li><li>B</li></ol><ol id="v"></ol>');
  const api = ativarStepper(document.querySelector('ol'), { doc: document, anunciar: () => {} });
  disparar(window, document.querySelector('.stepper-controles'), 'keydown', { key: 'ArrowRight' });
  assert.equal(api.estado().atual, 2);
  disparar(window, document.querySelector('.stepper-controles'), 'keydown', { key: 'ArrowLeft' });
  assert.equal(api.estado().atual, 1);
  assert.equal(ativarStepper(document.getElementById('v'), { doc: document, anunciar: () => {} }), null);
  assert.equal(ativarStepper(document.querySelector('ol'), { doc: document, anunciar: () => {} }), null, 'não ativa duas vezes');
});

const ORDENAR = `<div data-componente="ordenar" data-canonica="a,b,c"><ol>
<li data-id="a">Primeira</li><li data-id="b">Segunda</li><li data-id="c">Terceira</li></ol></div>`;
const ids = (raiz) => [...raiz.querySelectorAll('li')].map((li) => li.getAttribute('data-id')).join(',');

test('ordenar: Subir/Descer reordenam, extremos ficam desabilitados e Verificar dá feedback em texto', () => {
  const { window, document } = criarDom(ORDENAR);
  const raiz = document.querySelector('[data-componente="ordenar"]');
  const anunciar = capturaAnuncios();
  const api = ativarOrdenar(raiz, { doc: document, anunciar });
  const feedback = raiz.querySelector('.ordenar-feedback');
  const li = (id) => raiz.querySelector(`li[data-id="${id}"]`);
  assert.equal(li('a').querySelector('button[aria-label^="Subir"]').disabled, true);
  assert.equal(li('c').querySelector('button[aria-label^="Descer"]').disabled, true);
  disparar(window, li('c').querySelector('button[aria-label^="Subir"]'), 'click');
  assert.equal(ids(raiz), 'a,c,b');
  assert.deepEqual(api.ordem(), ['a', 'c', 'b']);
  assert.equal(anunciar.lista.at(-1), 'Terceira: posição 2 de 3');
  disparar(window, raiz.querySelector('.ordenar-verificar'), 'click');
  assert.match(feedback.textContent, /^1 de 3 etapas na posição certa/);
  disparar(window, li('c').querySelector('button[aria-label^="Descer"]'), 'click');
  assert.equal(ids(raiz), 'a,b,c');
  assert.equal(feedback.textContent, '', 'mover limpa o feedback antigo');
  disparar(window, raiz.querySelector('.ordenar-verificar'), 'click');
  assert.match(feedback.textContent, /^Ordem correta: 3 de 3/);
});

test('ordenar: markup inconsistente (canonica com tamanho diferente) não é ativado', () => {
  const { document } = criarDom(ORDENAR.replace('a,b,c', 'a,b'));
  assert.equal(ativarOrdenar(document.querySelector('div'), { doc: document, anunciar: () => {} }), null);
});

const CHECKLIST = '<ul data-componente="checklist" data-ferramenta="openspec"></ul>';

test('checklist: gera itens do catálogo, grava ao marcar, mostra progresso e selo, e anuncia', () => {
  const { window, document } = criarDom(CHECKLIST);
  const g = gerenciadorMemoria();
  const anunciar = capturaAnuncios();
  const raiz = document.querySelector('ul');
  ativarChecklist(raiz, { gerenciador: g, catalogo, anunciar, doc: document });
  const caixas = [...raiz.querySelectorAll('input[type="checkbox"]')];
  const total = catalogo.checklists.openspec.length;
  assert.equal(caixas.length, total);
  assert.ok(raiz.querySelector('label[for]'), 'itens rotulados');
  const progresso = document.querySelector('.checklist-progresso');
  const selo = document.querySelector('.checklist-selo');
  assert.equal(progresso.textContent, `0 de ${total} itens concluídos`);
  assert.equal(selo.hidden, true);
  marcar(window, caixas[0]);
  assert.ok(g.estado().checklists.get('openspec').has(caixas[0].getAttribute('data-item')));
  assert.equal(progresso.textContent, `1 de ${total} itens concluídos`);
  caixas.slice(1).forEach((c) => marcar(window, c));
  assert.equal(selo.hidden, false);
  assert.equal(selo.textContent, 'Exercício concluído');
  assert.equal(anunciar.lista.at(-1), 'Exercício concluído');
  marcar(window, caixas[0], false);
  assert.equal(selo.hidden, true);
  assert.equal(anunciar.lista.at(-1), 'Exercício não está mais concluído');
});

test('checklist: restaura o estado gravado na ativação, sem anunciar', () => {
  const g = gerenciadorMemoria();
  const itens = catalogo.checklists.openspec;
  for (const i of itens) g.alternarItem('openspec', i.id);
  const { document } = criarDom(CHECKLIST);
  const anunciar = capturaAnuncios();
  ativarChecklist(document.querySelector('ul'), { gerenciador: g, catalogo, anunciar, doc: document });
  assert.ok([...document.querySelectorAll('input')].every((c) => c.checked));
  assert.equal(document.querySelector('.checklist-selo').hidden, false);
  assert.deepEqual(anunciar.lista, []);
});
