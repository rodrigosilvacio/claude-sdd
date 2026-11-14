// Quiz por módulo (Requisitos 8.2 a 8.7, 18.x).
// Markup base: <div data-componente="quiz" data-modulo="openspec"></div>. Sem JS fica vazio
// (o curso exibe só o aviso estático). Textos sempre via textContent.
import { quizzes } from '../../data/quizzes.js';
import { avaliar } from '../core/quiz.js';
import { anunciar as anunciarPadrao } from './anuncio.js';

export const textoAprovado = (melhorPct) => `Quiz aprovado. Melhor resultado: ${melhorPct}%.`;
export const textoResultado = (r) => `Nota: ${r.acertos} de ${r.total} (${r.pct}%). ${r.aprovado ? 'Aprovado.' : 'Não aprovado. Você pode refazer o quiz quantas vezes quiser.'}`;
export const textoFaltando = (faltando) =>
  `Responda todas as questões. Sem resposta: ${faltando.map((i) => i + 1).join(', ')}.`;

const el = (doc, tag, classe, texto) => {
  const e = doc.createElement(tag);
  if (classe) e.className = classe;
  if (texto != null) e.textContent = texto;
  return e;
};

export function ativarQuiz(raiz, { gerenciador, anunciar, doc }) {
  if (raiz.getAttribute('data-quiz-ativo') === 'true') return null;
  const moduloId = raiz.getAttribute('data-modulo');
  const quiz = moduloId ? quizzes[moduloId] : null;
  if (!quiz || !quiz.questoes?.length) return null;
  raiz.setAttribute('data-quiz-ativo', 'true');

  const form = el(doc, 'form');
  form.noValidate = true;
  const status = el(doc, 'p', 'quiz-status');
  const alerta = el(doc, 'div', 'quiz-alerta');
  alerta.setAttribute('role', 'alert');
  const resultado = el(doc, 'p', 'quiz-resultado');
  resultado.setAttribute('tabindex', '-1');

  const fieldsets = [];
  const feedbacks = [];
  quiz.questoes.forEach((q, i) => {
    const fs = el(doc, 'fieldset', 'quiz-questao');
    fs.appendChild(el(doc, 'legend', null, `${i + 1}. ${q.enunciado}`));
    q.opcoes.forEach((op, j) => {
      const id = `quiz-${moduloId}-${i + 1}-${j + 1}`;
      const rotulo = el(doc, 'label');
      rotulo.setAttribute('for', id);
      const radio = el(doc, 'input');
      radio.type = 'radio';
      radio.name = `quiz-${moduloId}-${i + 1}`;
      radio.id = id;
      radio.value = String(j);
      const span = el(doc, 'span', null, op);
      rotulo.append(radio, ' ', span);
      const bloco = el(doc, 'div', 'quiz-opcao');
      bloco.appendChild(rotulo);
      fs.appendChild(bloco);
    });
    const fb = el(doc, 'p', 'quiz-feedback');
    fb.hidden = true;
    fs.appendChild(fb);
    fieldsets.push(fs);
    feedbacks.push(fb);
    form.appendChild(fs);
  });

  const enviar = el(doc, 'button', null, 'Enviar respostas');
  enviar.type = 'submit';
  const refazer = el(doc, 'button', null, 'Refazer o quiz');
  refazer.type = 'button';
  refazer.hidden = true;
  form.append(enviar, ' ', refazer);
  raiz.append(status, form, alerta, resultado);

  const atualizarStatus = () => {
    const reg = gerenciador.estado().quizzes.get(moduloId);
    status.textContent = reg && reg.aprovado ? textoAprovado(reg.melhorPct) : '';
    status.hidden = !(reg && reg.aprovado);
  };

  const respostas = () => quiz.questoes.map((_, i) => {
    const marcado = form.querySelector(`input[name="quiz-${moduloId}-${i + 1}"]:checked`);
    return marcado ? Number(marcado.value) : null;
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const r = avaliar(quiz, respostas());
    for (const fs of fieldsets) fs.removeAttribute('aria-invalid');
    if (!r.ok) {
      for (const i of r.faltando) fieldsets[i].setAttribute('aria-invalid', 'true');
      for (const fb of feedbacks) fb.hidden = true;
      resultado.textContent = '';
      const msg = textoFaltando(r.faltando);
      alerta.textContent = msg;
      anunciar(msg);
      return;
    }
    alerta.textContent = '';
    r.detalhes.forEach((d, i) => {
      const fb = feedbacks[i];
      fb.textContent = `${d.correta ? 'Correta.' : 'Incorreta.'} ${d.explicacao}`;
      fb.hidden = false;
      fb.setAttribute('data-correta', String(d.correta));
    });
    gerenciador.registrarQuiz(moduloId, r.pct);
    atualizarStatus();
    resultado.textContent = textoResultado(r);
    refazer.hidden = false;
    anunciar(textoResultado(r));
  });

  refazer.addEventListener('click', () => {
    form.reset();
    for (const fs of fieldsets) fs.removeAttribute('aria-invalid');
    for (const fb of feedbacks) { fb.hidden = true; fb.textContent = ''; }
    resultado.textContent = '';
    alerta.textContent = '';
    refazer.hidden = true;
    anunciar('Quiz reiniciado');
    form.querySelector('input')?.focus();
  });

  gerenciador.assinar(atualizarStatus);
  atualizarStatus();
  return { atualizarStatus };
}

/**
 * @param {Element[]} elementos
 * @param {{gerenciador:any, anunciar?:(t:string)=>void, doc?:Document}} ctx
 */
export function ativar(elementos, ctx = {}) {
  const doc = ctx.doc ?? globalThis.document;
  const { gerenciador } = ctx;
  if (!gerenciador) return;
  const anunciar = ctx.anunciar ?? ((t) => anunciarPadrao(t, doc));
  for (const raiz of elementos) {
    try { ativarQuiz(raiz, { gerenciador, anunciar, doc }); } catch (erro) { console.warn('Falha ao ativar Quiz:', erro); }
  }
}
