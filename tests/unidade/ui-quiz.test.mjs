// Testes de unidade da UI do Quiz. Requisitos: 8.2 a 8.7, 17.7, 17.8.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDom, gerenciadorMemoria, capturaAnuncios, disparar } from '../auxiliar/dom.mjs';
import { ativarQuiz, textoFaltando } from '../../assets/js/ui/quiz-ui.js';
import { quizzes } from '../../assets/data/quizzes.js';

const MOD = 'fundamentos';
const quiz = quizzes[MOD];

function montar(g = gerenciadorMemoria()) {
  const { window, document } = criarDom(`<div data-componente="quiz" data-modulo="${MOD}"></div>`);
  const anunciar = capturaAnuncios();
  const raiz = document.querySelector('div');
  ativarQuiz(raiz, { gerenciador: g, anunciar, doc: document });
  const form = raiz.querySelector('form');
  // linkedom avalia :checked pelo atributo; um navegador real reflete a propriedade.
  const responder = (i, j) => { raiz.querySelector(`#quiz-${MOD}-${i + 1}-${j + 1}`).setAttribute('checked', ''); };
  const enviar = () => disparar(window, form, 'submit');
  return { window, document, raiz, form, g, anunciar, responder, enviar };
}

test('quiz: estrutura acessível com fieldset/legend e radios rotulados', () => {
  const { raiz } = montar();
  const fs = raiz.querySelectorAll('fieldset');
  assert.equal(fs.length, quiz.questoes.length);
  assert.ok([...fs].every((f) => f.querySelector('legend')));
  const radios = raiz.querySelectorAll('input[type="radio"]');
  assert.equal(radios.length, quiz.questoes.reduce((n, q) => n + q.opcoes.length, 0));
  assert.ok([...radios].every((r) => raiz.querySelector(`label[for="${r.id}"]`)));
});

test('quiz: resposta ausente lista as questões em role="alert", marca aria-invalid e não grava', () => {
  const t = montar();
  t.responder(0, quiz.questoes[0].correta); // só a primeira
  t.enviar();
  const faltando = quiz.questoes.map((_, i) => i).slice(1);
  const alerta = t.raiz.querySelector('[role="alert"]');
  assert.equal(alerta.textContent, textoFaltando(faltando));
  const invalidos = [...t.raiz.querySelectorAll('fieldset[aria-invalid="true"]')];
  assert.equal(invalidos.length, faltando.length);
  assert.equal(t.raiz.querySelector('fieldset').hasAttribute('aria-invalid'), false);
  assert.equal(t.g.estado().quizzes.size, 0);
  assert.equal(t.anunciar.lista.at(-1), textoFaltando(faltando));
});

test('quiz: todas corretas aprova, mostra nota e feedback por questão e grava o resultado', () => {
  const t = montar();
  quiz.questoes.forEach((q, i) => t.responder(i, q.correta));
  t.enviar();
  const total = quiz.questoes.length;
  assert.match(t.raiz.querySelector('.quiz-resultado').textContent, new RegExp(`Nota: ${total} de ${total} \\(100%\\)\\. Aprovado\\.`));
  const fbs = [...t.raiz.querySelectorAll('.quiz-feedback')];
  assert.ok(fbs.every((f) => !f.hidden && f.textContent.startsWith('Correta.')));
  assert.deepEqual(t.g.estado().quizzes.get(MOD), { aprovado: true, melhorPct: 100 });
  assert.equal(t.raiz.querySelector('.quiz-status').textContent, 'Quiz aprovado. Melhor resultado: 100%.');
  assert.equal(t.raiz.querySelector('[role="alert"]').textContent, '');
});

test('quiz: reprovação marca incorretas, não aprova e mostra o status aprovado ao reabrir quando já aprovado', () => {
  const t = montar();
  quiz.questoes.forEach((q, i) => t.responder(i, (q.correta + 1) % q.opcoes.length));
  t.enviar();
  assert.match(t.raiz.querySelector('.quiz-resultado').textContent, /Não aprovado\./);
  assert.ok([...t.raiz.querySelectorAll('.quiz-feedback')].every((f) => f.textContent.startsWith('Incorreta.')));
  assert.equal(t.g.estado().quizzes.get(MOD).aprovado, false);
  assert.equal(t.raiz.querySelector('.quiz-status').hidden, true);

  // Reabrir a página com o módulo já aprovado mostra o status.
  const g2 = gerenciadorMemoria();
  g2.registrarQuiz(MOD, 100);
  const t2 = montar(g2);
  assert.equal(t2.raiz.querySelector('.quiz-status').textContent, 'Quiz aprovado. Melhor resultado: 100%.');
});

test('quiz: módulo desconhecido não é ativado e não ativa duas vezes', () => {
  const { document } = criarDom('<div data-modulo="nao-existe"></div>');
  const ctx = { gerenciador: gerenciadorMemoria(), anunciar: () => {}, doc: document };
  assert.equal(ativarQuiz(document.querySelector('div'), ctx), null);
  const t = montar();
  assert.equal(ativarQuiz(t.raiz, { gerenciador: t.g, anunciar: () => {}, doc: t.document }), null);
});
