// Testes de unidade da UI: menu, copiar (fallback) e avisos.
// Requisitos: 3.3, 3.4, 5.4, 11.2, 11.3, 13.4 a 13.9.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDom, gerenciadorMemoria, gerenciadorSemStorage, disparar } from '../auxiliar/dom.mjs';
import { ativar as ativarMenu, aplicarSelo } from '../../assets/js/ui/menu.js';
import { copiarTexto, ativar as ativarCopiar } from '../../assets/js/ui/copiar.js';
import { ativar as ativarAvisos, TEXTOS } from '../../assets/js/ui/avisos.js';

const MENU = `<nav data-componente="menu"><button class="menu-botao" type="button" aria-controls="lista-menu" aria-expanded="true">Menu</button>
<ul id="lista-menu"><li><a data-modulo="openspec" href="a.html">OpenSpec</a></li>
<li><a data-modulo="bmad" data-licao="licao:bmad/tutorial" href="b.html">BMAD</a></li></ul></nav>`;
const estreita = { matchMedia: () => ({ matches: false }) };
const larga = { matchMedia: () => ({ matches: true }) };

test('menu: em tela estreita começa recolhido, abre e recolhe pelo botão', () => {
  const { window, document } = criarDom(MENU);
  ativarMenu([document.querySelector('nav')], { doc: document, win: estreita, gerenciador: gerenciadorMemoria() });
  const botao = document.querySelector('.menu-botao');
  const lista = document.getElementById('lista-menu');
  assert.equal(botao.getAttribute('aria-expanded'), 'false');
  assert.equal(lista.hidden, true);
  disparar(window, botao, 'click');
  assert.equal(botao.getAttribute('aria-expanded'), 'true');
  assert.equal(lista.hidden, false);
  disparar(window, botao, 'click');
  assert.equal(botao.getAttribute('aria-expanded'), 'false');
  assert.equal(lista.hidden, true);
});

test('menu: Esc recolhe o menu aberto; outras teclas não', () => {
  const { window, document } = criarDom(MENU);
  const nav = document.querySelector('nav');
  ativarMenu([nav], { doc: document, win: estreita, gerenciador: gerenciadorMemoria() });
  const botao = document.querySelector('.menu-botao');
  disparar(window, botao, 'click');
  disparar(window, nav, 'keydown', { key: 'Enter' });
  assert.equal(botao.getAttribute('aria-expanded'), 'true');
  disparar(window, nav, 'keydown', { key: 'Escape' });
  assert.equal(botao.getAttribute('aria-expanded'), 'false');
  assert.equal(document.getElementById('lista-menu').hidden, true);
});

test('menu: em tela larga fica expandido e Esc não recolhe', () => {
  const { window, document } = criarDom(MENU);
  const nav = document.querySelector('nav');
  ativarMenu([nav], { doc: document, win: larga, gerenciador: gerenciadorMemoria() });
  assert.equal(document.querySelector('.menu-botao').getAttribute('aria-expanded'), 'true');
  disparar(window, nav, 'keydown', { key: 'Escape' });
  assert.equal(document.querySelector('.menu-botao').getAttribute('aria-expanded'), 'true');
});

test('menu: destaca o módulo atual e põe o selo textual "concluída" conforme o progresso', () => {
  const { document } = criarDom(MENU);
  document.body.setAttribute('data-modulo', 'bmad');
  const g = gerenciadorMemoria();
  ativarMenu([document.querySelector('nav')], { doc: document, win: larga, gerenciador: g });
  const bmad = document.querySelector('a[data-modulo="bmad"]');
  assert.equal(bmad.getAttribute('aria-current'), 'true');
  assert.ok(bmad.classList.contains('modulo-atual'));
  assert.equal(document.querySelector('a[data-modulo="openspec"]').hasAttribute('aria-current'), false);
  assert.equal(bmad.querySelector('.selo-concluida'), null);
  g.marcarLicao('licao:bmad/tutorial', true);
  assert.match(bmad.querySelector('.selo-concluida').textContent, /concluída/);
  g.marcarLicao('licao:bmad/tutorial', false);
  assert.equal(bmad.querySelector('.selo-concluida'), null);
  aplicarSelo(bmad, true);
  aplicarSelo(bmad, true);
  assert.equal(bmad.querySelectorAll('.selo-concluida').length, 1);
});

test('copiar: usa navigator.clipboard quando disponível', async () => {
  const { document } = criarDom('<pre id="c">npm i</pre>');
  let escrito = null; let execChamado = false;
  document.execCommand = () => { execChamado = true; return true; };
  const nav = { clipboard: { writeText: async (t) => { escrito = t; } } };
  assert.equal(await copiarTexto('npm i', null, document, nav), true);
  assert.equal(escrito, 'npm i');
  assert.equal(execChamado, false);
});

test('copiar: fallback para execCommand se clipboard ausente ou recusa', async () => {
  for (const nav of [undefined, {}, { clipboard: { writeText: async () => { throw new Error('negado'); } } }]) {
    const { document } = criarDom('<pre id="c">npm i</pre>');
    const comandos = [];
    document.execCommand = (c) => { comandos.push(c); return true; };
    assert.equal(await copiarTexto('npm i', null, document, nav ?? null), true);
    assert.deepEqual(comandos, ['copy']);
    assert.equal(document.querySelector('textarea'), null, 'textarea temporário removido');
  }
});

test('copiar: devolve false quando nenhuma forma de copiar existe ou execCommand falha', async () => {
  const { document } = criarDom('');
  assert.equal(await copiarTexto('x', null, document, null), false);
  document.execCommand = () => false;
  assert.equal(await copiarTexto('x', null, document, null), false);
  document.execCommand = () => { throw new Error('bloqueado'); };
  assert.equal(await copiarTexto('x', null, document, null), false);
});

test('copiar: botão anuncia sucesso e falha em texto', async () => {
  const { window, document } = criarDom('<div class="bloco-codigo"><pre>npm i</pre><button type="button" data-componente="copiar">Copiar</button></div>');
  const botao = document.querySelector('button');
  document.execCommand = () => true;
  ativarCopiar([botao], { doc: document });
  disparar(window, botao, 'click');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(botao.textContent, 'Copiado');
  assert.equal(document.getElementById('anuncios').textContent, 'Comando copiado');
  document.execCommand = () => false;
  disparar(window, botao, 'click');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(botao.textContent, 'Falhou');
  assert.match(document.getElementById('anuncios').textContent, /Não foi possível copiar/);
});

test('avisos: sempre mostra o aviso de progresso local; sem storage mostra também o de indisponível', () => {
  const a = criarDom('');
  ativarAvisos([], { doc: a.document, win: {}, gerenciador: gerenciadorMemoria() });
  const textosA = [...a.document.querySelectorAll('[data-componente="avisos-progresso"] p')].map((p) => p.textContent);
  assert.deepEqual(textosA, [TEXTOS.local]);
  assert.equal(a.document.getElementById('anuncios'), null, 'o aviso fixo não é anunciado');

  const b = criarDom('');
  ativarAvisos([], { doc: b.document, win: {}, gerenciador: gerenciadorSemStorage() });
  const textosB = [...b.document.querySelectorAll('[data-componente="avisos-progresso"] p')].map((p) => p.textContent);
  assert.deepEqual(textosB, [TEXTOS.semArmazenamento, TEXTOS.local]);
  assert.equal(b.document.getElementById('anuncios').textContent, TEXTOS.semArmazenamento);
});

test('avisos: dados corrompidos geram aviso próprio', () => {
  const { document } = criarDom('');
  const g = criarGerenciadorCorrompido();
  ativarAvisos([], { doc: document, win: {}, gerenciador: g });
  assert.ok([...document.querySelectorAll('p')].some((p) => p.textContent === TEXTOS.corrompido));
});

function criarGerenciadorCorrompido() {
  return gerenciadorMemoriaCom('{não é json');
}
import { criarGerenciador, CHAVE } from '../../assets/js/core/progresso.js';
function gerenciadorMemoriaCom(texto) {
  return criarGerenciador(() => ({ getItem: (k) => (k === CHAVE ? texto : null), setItem() {}, removeItem() {} }));
}

test('avisos: reiniciar só apaga o progresso após confirmação', async () => {
  const { window, document } = criarDom('<button type="button" data-componente="reiniciar-progresso">Reiniciar</button>');
  const g = gerenciadorMemoria();
  g.marcarLicao('licao:x', true);
  let confirmar = false;
  ativarAvisos([], { doc: document, win: { confirm: () => confirmar }, gerenciador: g });
  const botao = document.querySelector('button');
  disparar(window, botao, 'click');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(g.licaoConcluida('licao:x'), true, 'cancelar mantém o progresso');
  confirmar = true;
  disparar(window, botao, 'click');
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(g.licaoConcluida('licao:x'), false);
  assert.match(document.getElementById('anuncios').textContent, /Progresso reiniciado/);
});
